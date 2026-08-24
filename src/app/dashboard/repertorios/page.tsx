import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { removerRepertorioAction } from "@/lib/actions/repertorios";

export default async function RepertoriosPage() {
  const { profile } = await requireAuth();
  const repos = await getRepositories();
  const repertorios = await repos.repertorios.list();
  const isAdmin = profile.perfil === "ADMIN";

  return (
    <div className="mx-auto max-w-[1240px]">
      <div className="mb-7 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
        <PageHeader title="Repertórios" description="Conjuntos de músicas organizados por ocasião." />
        {isAdmin && (
          <Link href="/dashboard/repertorios/novo" className="db-cta">
            <Plus size={16} />
            Novo repertório
          </Link>
        )}
      </div>

      <DataTable
        headers={["Nome", "Músicas", ""]}
        isEmpty={repertorios.length === 0}
        emptyMessage="Nenhum repertório cadastrado ainda."
      >
        {repertorios.map((r) => (
          <tr key={r.id}>
            <td className="px-4 py-3.5 text-paper font-medium">{r.nome}</td>
            <td className="px-4 py-3.5 text-muted">{r.musicaIds.length} música(s)</td>
            <td className="px-4 py-3.5 text-right">
              {isAdmin && (
                <div className="flex justify-end gap-3">
                  <Link href={`/dashboard/repertorios/${r.id}`} className="db-btn-sm">
                    Editar
                  </Link>
                  <form action={removerRepertorioAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" className="text-xs font-semibold text-red-400 hover:text-red-300">
                      Excluir
                    </button>
                  </form>
                </div>
              )}
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
