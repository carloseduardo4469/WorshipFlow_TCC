import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { removerRepertorioAction } from "@/lib/actions/repertorios";

export default async function RepertoriosPage() {
  const { profile } = await requireAuth();
  const repos = await getRepositories();
  const repertorios = await repos.repertorios.list();
  const isAdmin = profile.perfil === "ADMIN";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageHeader title="Repertórios" description="Conjuntos de músicas organizados por ocasião." />
        {isAdmin && (
          <Link href="/dashboard/repertorios/novo">
            <Button>Novo repertório</Button>
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
            <td className="px-4 py-3 text-paper">{r.nome}</td>
            <td className="px-4 py-3 text-muted">{r.musicaIds.length} música(s)</td>
            <td className="px-4 py-3 text-right">
              {isAdmin && (
                <div className="flex justify-end gap-3">
                  <Link
                    href={`/dashboard/repertorios/${r.id}`}
                    className="text-xs text-amber hover:underline"
                  >
                    Editar
                  </Link>
                  <form action={removerRepertorioAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" className="text-xs text-red-400 hover:underline">
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
