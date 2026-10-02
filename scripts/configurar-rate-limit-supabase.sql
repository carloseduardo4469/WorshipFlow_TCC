-- Aplicar antes de publicar o código que chama consume_form_rate_limit.
-- Não altera tabelas nem políticas de dados do ministério.
begin;
create schema if not exists worshipflow_private;
revoke all on schema worshipflow_private from public, anon, authenticated;
grant usage on schema worshipflow_private to service_role;

create table if not exists worshipflow_private.form_rate_limits (
  key text primary key check (key ~ '^[0-9a-f]{64}$'),
  hits integer not null check (hits > 0),
  expires_at timestamptz not null
);
create index if not exists form_rate_limits_expiry_idx
  on worshipflow_private.form_rate_limits (expires_at);
alter table worshipflow_private.form_rate_limits enable row level security;
revoke all on worshipflow_private.form_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on worshipflow_private.form_rate_limits to service_role;

create or replace function public.consume_form_rate_limit(
  p_key text, p_limit integer, p_window_seconds integer
) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_hits integer;
  v_expiry timestamptz;
begin
  if p_key is null or p_key !~ '^[0-9a-f]{64}$'
    or p_limit is null or p_limit < 1 or p_limit > 1000
    or p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate limit parameters';
  end if;

  -- Limpeza limitada, sem aguardar linhas usadas por outras requisições.
  delete from worshipflow_private.form_rate_limits where key in (
    select key from worshipflow_private.form_rate_limits
    where expires_at < v_now - interval '1 day'
    order by expires_at limit 100 for update skip locked
  );

  insert into worshipflow_private.form_rate_limits as bucket (key, hits, expires_at)
  values (p_key, 1, v_now + make_interval(secs => p_window_seconds))
  on conflict (key) do update set
    hits = case when bucket.expires_at <= v_now then 1 else least(bucket.hits + 1, p_limit + 1) end,
    expires_at = case when bucket.expires_at <= v_now
      then v_now + make_interval(secs => p_window_seconds) else bucket.expires_at end
  returning hits, expires_at into v_hits, v_expiry;

  return jsonb_build_object(
    'allowed', v_hits <= p_limit,
    'retry_after', case when v_hits <= p_limit then 0
      else greatest(1, ceil(extract(epoch from (v_expiry - v_now)))::integer) end
  );
end;
$$;
revoke all on function public.consume_form_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_form_rate_limit(text, integer, integer) to service_role;
commit;
