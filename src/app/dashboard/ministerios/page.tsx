import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { removerMinisterioAction } from "@/lib/actions/ministerios";

export default async function MinisteriosPage() {
  await requireAdmin();
  const repos = await getRepositories();
  const ministerios = await repos.ministerios.list();

  return (
    <div>
      <div className="mb-7 flex items-center justify-between gap-4">
        <PageHeader title="Ministérios" description="Grupos de louvor da igreja." />
        <Link href="/dashboard/ministerios/novo" className="db-cta">
          <Plus size={16} />
          Novo ministério
        </Link>
      </div>

      <DataTable
        headers={["Nome", "Descrição", "Status", ""]}
        isEmpty={ministerios.length === 0}
        emptyMessage="Nenhum ministério cadastrado ainda."
      >
        {ministerios.map((m) => (
          <tr key={m.id}>
            <td className="px-4 py-3.5 text-paper font-medium">{m.nome}</td>
            <td className="px-4 py-3.5 text-muted">{m.descricao ?? "—"}</td>
            <td className="px-4 py-3.5">
              <span
                className={
                  m.ativo
                    ? "db-badge db-badge-green"
                    : "db-badge db-badge-muted"
                }
              >
                {m.ativo ? "Ativo" : "Inativo"}
              </span>
            </td>
            <td className="px-4 py-3.5 text-right">
              <div className="flex justify-end gap-3">
                <Link href={`/dashboard/ministerios/${m.id}`} className="db-btn-sm">
                  Editar
                </Link>
                <form action={removerMinisterioAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="text-xs font-semibold text-red-400 hover:text-red-300">
                    Excluir
                  </button>
                </form>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
