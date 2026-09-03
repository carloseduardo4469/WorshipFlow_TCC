-- Execute uma vez no SQL Editor do Supabase.
-- Os usuários atuais permanecem ATIVO; novos profiles começam PENDENTE.

begin;

update public.profiles
set status_ministerio = 'ATIVO'
where status_ministerio is null;

alter table public.profiles
  alter column status_ministerio set default 'PENDENTE',
  alter column status_ministerio set not null;

alter table public.profiles
  drop constraint if exists profiles_status_ministerio_check;

alter table public.profiles
  add constraint profiles_status_ministerio_check
  check (status_ministerio in ('PENDENTE', 'ATIVO'));

commit;

select status_ministerio, count(*)
from public.profiles
group by status_ministerio
order by status_ministerio;
