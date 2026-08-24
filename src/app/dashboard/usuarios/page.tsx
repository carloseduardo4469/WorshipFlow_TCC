import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";

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

      <DataTable headers={["Nome", "Instrumento", "Status"]} isEmpty={usuarios.length === 0} emptyMessage="Ninguém se cadastrou ainda.">
        {usuarios.map((usuario) => (
          <tr key={usuario.id}>
            <td className="px-4 py-3.5 text-paper font-medium">{usuario.nome}</td>
            <td className="px-4 py-3.5 text-muted">{usuario.instrumentoPrincipal ?? "Não informado"}</td>
            <td className="px-4 py-3.5"><span className={usuario.statusMinisterio === "ATIVO" ? "db-badge db-badge-green" : "db-badge db-badge-muted"}>{usuario.statusMinisterio === "ATIVO" ? "Ativo" : "Inativo"}</span></td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
