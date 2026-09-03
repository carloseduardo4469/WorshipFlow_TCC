-- WorshipFlow usa uma única equipe. Esta migração remove a antiga camada
-- multi-ministério sem apagar usuários, músicas, repertórios ou escalas.
-- Execute uma vez no SQL Editor do Supabase depois de publicar o código novo.

begin;

alter table if exists public.profiles
  drop column if exists ministerio_id;

-- status_ministerio permanece: agora controla a aprovação de acesso
-- (PENDENTE para novos cadastros e ATIVO após aprovação administrativa).

alter table if exists public.musicas
  drop column if exists ministerio_id;

alter table if exists public.repertorios
  drop column if exists ministerio_id;

alter table if exists public.escalas
  drop column if exists ministerio_id;

drop table if exists public.ministerios;

commit;

-- Conferência: esta consulta deve retornar zero linhas.
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (
    table_name = 'ministerios'
    or column_name = 'ministerio_id'
  )
order by table_name, column_name;
