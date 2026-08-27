-- WorshipFlow — schema Supabase (Postgres)
-- Rode isso no SQL editor do Supabase (ou via CLI: supabase db push)

create extension if not exists "pgcrypto";

-- =========================================================
-- Tabelas
-- =========================================================

create table if not exists public.ministerios (
  id bigint generated always as identity primary key,
  nome varchar(120) not null,
  descricao varchar(500),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- "profiles" substitui a antiga tabela `usuarios`.
-- id é o mesmo uuid de auth.users — não guardamos mais senha aqui,
-- isso fica 100% a cargo do Supabase Auth (email/senha e Google OAuth).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome varchar(120) not null,
  email varchar(160) not null unique,
  telefone varchar(30),
  instrumento_principal varchar(80),
  habilidades varchar(300),
  status_ministerio varchar(30) not null default 'ATIVO'
    check (status_ministerio in ('ATIVO', 'INATIVO')),
  is_suspended boolean not null default false,
  perfil varchar(30) not null default 'MEMBRO'
    check (perfil in ('ADMIN', 'MEMBRO')),
  foto_perfil_url text,
  ministerio_id bigint references public.ministerios(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Compatibilidade com instalações que já tinham a tabela profiles criada.
alter table public.profiles
  add column if not exists is_suspended boolean not null default false;

create table if not exists public.musicas (
  id bigint generated always as identity primary key,
  titulo varchar(140) not null,
  artista varchar(120),
  tonalidade varchar(12),
  bpm integer,
  link_cifra varchar(500),
  ministerio_id bigint references public.ministerios(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.repertorios (
  id bigint generated always as identity primary key,
  nome varchar(140) not null,
  descricao varchar(500),
  ministerio_id bigint references public.ministerios(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.repertorio_musicas (
  repertorio_id bigint not null references public.repertorios(id) on delete cascade,
  musica_id bigint not null references public.musicas(id) on delete cascade,
  primary key (repertorio_id, musica_id)
);

create table if not exists public.escalas (
  id bigint generated always as identity primary key,
  titulo varchar(140) not null,
  data_escala date,
  status varchar(30) not null default 'RASCUNHO'
    check (status in ('RASCUNHO', 'PUBLICADA', 'CONCLUIDA', 'CANCELADA')),
  observacoes varchar(600),
  -- Antes eram varchar(2000) com texto solto. Agora jsonb estruturado:
  -- funcoes_usuarios: [{ "usuarioId": "...", "funcao": "Vocal" }, ...]
  -- tonalidades_musicas: [{ "musicaId": 1, "tonalidade": "G" }, ...]
  funcoes_usuarios jsonb not null default '[]',
  tonalidades_musicas jsonb not null default '[]',
  ministerio_id bigint references public.ministerios(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.escala_usuarios (
  escala_id bigint not null references public.escalas(id) on delete cascade,
  usuario_id uuid not null references public.profiles(id) on delete cascade,
  primary key (escala_id, usuario_id)
);

create table if not exists public.escala_musicas (
  escala_id bigint not null references public.escalas(id) on delete cascade,
  musica_id bigint not null references public.musicas(id) on delete cascade,
  primary key (escala_id, musica_id)
);

create table if not exists public.usuario_musicas_favoritas (
  usuario_id uuid not null references public.profiles(id) on delete cascade,
  musica_id bigint not null references public.musicas(id) on delete cascade,
  primary key (usuario_id, musica_id)
);

-- =========================================================
-- Índices
-- =========================================================

create index if not exists idx_musicas_ministerio_id on public.musicas(ministerio_id);
create index if not exists idx_profiles_ministerio_id on public.profiles(ministerio_id);
create index if not exists idx_profiles_status on public.profiles(status_ministerio);
create index if not exists idx_profiles_suspended on public.profiles(is_suspended);
create index if not exists idx_escalas_ministerio_id on public.escalas(ministerio_id);
create index if not exists idx_escalas_status_data on public.escalas(status, data_escala);
create index if not exists idx_repertorios_ministerio_id on public.repertorios(ministerio_id);

-- =========================================================
-- Trigger: cria profile automaticamente ao criar usuário no Auth
-- (cobre tanto cadastro por email/senha quanto Google OAuth)
-- =========================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'nome',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.ministerios enable row level security;
alter table public.profiles enable row level security;
alter table public.musicas enable row level security;
alter table public.repertorios enable row level security;
alter table public.repertorio_musicas enable row level security;
alter table public.escalas enable row level security;
alter table public.escala_usuarios enable row level security;
alter table public.escala_musicas enable row level security;
alter table public.usuario_musicas_favoritas enable row level security;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and perfil = 'ADMIN'
  );
$$ language sql security definer stable set search_path = public;

-- Permite executar este schema novamente sem conflito com policies existentes.
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update_self_or_admin" on public.profiles;
drop policy if exists "profiles_insert_admin" on public.profiles;
drop policy if exists "profiles_delete_admin" on public.profiles;
drop policy if exists "ministerios_select" on public.ministerios;
drop policy if exists "ministerios_write" on public.ministerios;
drop policy if exists "musicas_select" on public.musicas;
drop policy if exists "musicas_write" on public.musicas;
drop policy if exists "repertorios_select" on public.repertorios;
drop policy if exists "repertorios_write" on public.repertorios;
drop policy if exists "repertorio_musicas_select" on public.repertorio_musicas;
drop policy if exists "repertorio_musicas_write" on public.repertorio_musicas;
drop policy if exists "escalas_select" on public.escalas;
drop policy if exists "escalas_write" on public.escalas;
drop policy if exists "escala_usuarios_select" on public.escala_usuarios;
drop policy if exists "escala_usuarios_write" on public.escala_usuarios;
drop policy if exists "escala_musicas_select" on public.escala_musicas;
drop policy if exists "escala_musicas_write" on public.escala_musicas;
drop policy if exists "favoritas_select" on public.usuario_musicas_favoritas;
drop policy if exists "favoritas_write_self" on public.usuario_musicas_favoritas;

-- profiles: todo autenticado lê; cada um edita o próprio; ADMIN edita/cria/apaga qualquer um
create policy "profiles_select" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles_update_self_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());
create policy "profiles_insert_admin" on public.profiles
  for insert with check (public.is_admin());
create policy "profiles_delete_admin" on public.profiles
  for delete using (public.is_admin());

-- ministerios / musicas / repertorios / escalas: leitura autenticada, escrita só ADMIN
create policy "ministerios_select" on public.ministerios for select using (auth.role() = 'authenticated');
create policy "ministerios_write" on public.ministerios for all using (public.is_admin()) with check (public.is_admin());

create policy "musicas_select" on public.musicas for select using (auth.role() = 'authenticated');
create policy "musicas_write" on public.musicas for all using (public.is_admin()) with check (public.is_admin());

create policy "repertorios_select" on public.repertorios for select using (auth.role() = 'authenticated');
create policy "repertorios_write" on public.repertorios for all using (public.is_admin()) with check (public.is_admin());

create policy "repertorio_musicas_select" on public.repertorio_musicas for select using (auth.role() = 'authenticated');
create policy "repertorio_musicas_write" on public.repertorio_musicas for all using (public.is_admin()) with check (public.is_admin());

create policy "escalas_select" on public.escalas for select using (auth.role() = 'authenticated');
create policy "escalas_write" on public.escalas for all using (public.is_admin()) with check (public.is_admin());

create policy "escala_usuarios_select" on public.escala_usuarios for select using (auth.role() = 'authenticated');
create policy "escala_usuarios_write" on public.escala_usuarios for all using (public.is_admin()) with check (public.is_admin());

create policy "escala_musicas_select" on public.escala_musicas for select using (auth.role() = 'authenticated');
create policy "escala_musicas_write" on public.escala_musicas for all using (public.is_admin()) with check (public.is_admin());

-- favoritas: cada usuário só mexe nas próprias; ADMIN pode ler todas
create policy "favoritas_select" on public.usuario_musicas_favoritas
  for select using (usuario_id = auth.uid() or public.is_admin());
create policy "favoritas_write_self" on public.usuario_musicas_favoritas
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
