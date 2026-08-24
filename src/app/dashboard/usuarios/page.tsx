import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { EquipeTable } from "@/components/dashboard/EquipeTable";

export default async function EquipePage() {
  await requireAuth();
  const repos = await getRepositories();
  const usuarios = await repos.usuarios.list();

  return (
    <div className="mx-auto max-w-[1240px]">
      <PageHeader
        title="Equipe"
        description="Conheça as pessoas que fazem parte do ministério de louvor."
      />

      {usuarios.length === 0 ? <div className="db-empty db-empty-modern">Ninguém se cadastrou ainda.</div> : <EquipeTable usuarios={usuarios} />}
    </div>
  );
}
