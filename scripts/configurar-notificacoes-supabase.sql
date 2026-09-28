-- Executar uma vez no SQL Editor do projeto Supabase. Migração aditiva.
begin;
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles(id) on delete cascade,
  escala_id bigint,
  tipo text not null check (tipo in ('nova','entrada','saida','alteracao','cancelamento')),
  titulo text not null,
  mensagem text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists notifications_user_date on public.notifications(usuario_id, created_at desc);
create table if not exists public.push_subscriptions (
  id uuid primary key,
  usuario_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  updated_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user on public.push_subscriptions(usuario_id);
create table if not exists public.push_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  lease uuid,
  completed_at timestamptz,
  failed_at timestamptz,
  unique(notification_id, subscription_id)
);
create index if not exists push_deliveries_pending on public.push_deliveries(available_at) where completed_at is null and failed_at is null;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.push_deliveries enable row level security;
-- Todos os acessos passam por funções autenticadas do servidor com filtro de dono.
revoke all on public.notifications, public.push_subscriptions, public.push_deliveries from anon, authenticated;
grant all on public.notifications, public.push_subscriptions, public.push_deliveries to service_role;

-- Escala, vínculos, caixa de entrada e fila de envio na mesma transação.
create or replace function public.wf_save_schedule(
  p_mode text, p_id bigint, p_before jsonb, p_after jsonb, p_notices jsonb
) returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare
  old_row jsonb;
  old_users jsonb;
  old_songs jsonb;
  result_id bigint;
  notice jsonb;
  notice_id uuid;
begin
  if p_mode not in ('criar','editar','repertorio','excluir') then raise exception 'Invalid mode'; end if;
  if p_mode <> 'criar' then
    select to_jsonb(e) into old_row from public.escalas e where id = p_id for update;
    if old_row is null then raise exception 'Schedule not found'; end if;
    old_row := old_row || jsonb_build_object('funcoes_usuarios', coalesce(nullif(old_row->'funcoes_usuarios', 'null'::jsonb), '[]'::jsonb), 'tonalidades_musicas', coalesce(nullif(old_row->'tonalidades_musicas', 'null'::jsonb), '[]'::jsonb));
    select coalesce(jsonb_agg(usuario_id), '[]'::jsonb) into old_users from public.escala_usuarios where escala_id = p_id;
    select coalesce(jsonb_agg(musica_id), '[]'::jsonb) into old_songs from public.escala_musicas where escala_id = p_id;
    if not (old_row @> (p_before - 'usuario_ids' - 'musica_ids'))
      or not ((old_row->'funcoes_usuarios') <@ (p_before->'funcoes_usuarios'))
      or not ((old_row->'tonalidades_musicas') <@ (p_before->'tonalidades_musicas'))
      or not (old_users @> (p_before->'usuario_ids') and old_users <@ (p_before->'usuario_ids'))
      or not (old_songs @> (p_before->'musica_ids') and old_songs <@ (p_before->'musica_ids')) then
      raise exception 'WF_CONFLICT';
    end if;
  end if;
  if p_mode = 'criar' then
    insert into public.escalas(titulo, data_escala, status, observacoes, funcoes_usuarios, tonalidades_musicas)
    values (p_after->>'titulo', (p_after->>'data_escala')::date, p_after->>'status', p_after->>'observacoes', p_after->'funcoes_usuarios', p_after->'tonalidades_musicas') returning id into result_id;
  else
    result_id := p_id;
    if p_mode = 'excluir' then
      delete from public.escalas where id = p_id;
    elsif p_mode = 'editar' then
      update public.escalas set titulo = p_after->>'titulo', data_escala = (p_after->>'data_escala')::date,
        observacoes = p_after->>'observacoes', funcoes_usuarios = p_after->'funcoes_usuarios' where id = p_id;
    else
      update public.escalas set tonalidades_musicas = p_after->'tonalidades_musicas' where id = p_id;
    end if;
  end if;
  if p_mode in ('criar','editar') then
    delete from public.escala_usuarios where escala_id = result_id;
    insert into public.escala_usuarios(escala_id, usuario_id)
      select result_id, value::uuid from jsonb_array_elements_text(p_after->'usuario_ids');
  end if;
  if p_mode in ('criar','repertorio') then
    delete from public.escala_musicas where escala_id = result_id;
    insert into public.escala_musicas(escala_id, musica_id)
      select result_id, value::bigint from jsonb_array_elements_text(p_after->'musica_ids');
  end if;
  for notice in select value from jsonb_array_elements(p_notices) loop
    insert into public.notifications(usuario_id, escala_id, tipo, titulo, mensagem)
      values ((notice->>'usuario_id')::uuid, result_id, notice->>'tipo', notice->>'titulo', notice->>'mensagem') returning id into notice_id;
    insert into public.push_deliveries(notification_id, subscription_id)
      select notice_id, id from public.push_subscriptions where usuario_id = (notice->>'usuario_id')::uuid;
  end loop;
  return result_id;
end;
$$;
revoke all on function public.wf_save_schedule(text,bigint,jsonb,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.wf_save_schedule(text,bigint,jsonb,jsonb,jsonb) to service_role;

create or replace function public.wf_claim_push() returns setof public.push_deliveries
language plpgsql security definer set search_path = public, pg_temp as $wf$
begin
  update public.push_deliveries set failed_at = now()
    where completed_at is null and failed_at is null and attempts >= 6 and available_at <= now();
  return query update public.push_deliveries set lease = gen_random_uuid(), attempts = attempts + 1, available_at = now() + interval '5 minutes'
  where id in (select id from public.push_deliveries where completed_at is null and failed_at is null
    and available_at <= now() and attempts < 6 order by available_at for update skip locked limit 20)
  returning *;
end;
$wf$;
revoke all on function public.wf_claim_push() from public, anon, authenticated;
grant execute on function public.wf_claim_push() to service_role;
commit;
