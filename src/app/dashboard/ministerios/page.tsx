import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { removerMinisterioAction } from "@/lib/actions/ministerios";

export default async function MinisteriosPage() {
  await requireAdmin();
  const repos = await getRepositories();
  const ministerios = await repos.ministerios.list();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageHeader title="Ministérios" description="Grupos de louvor da igreja." />
        <Link href="/dashboard/ministerios/novo">
          <Button>Novo ministério</Button>
        </Link>
      </div>

      <DataTable
        headers={["Nome", "Descrição", "Status", ""]}
        isEmpty={ministerios.length === 0}
        emptyMessage="Nenhum ministério cadastrado ainda."
      >
        {ministerios.map((m) => (
          <tr key={m.id}>
            <td className="px-4 py-3 text-paper">{m.nome}</td>
            <td className="px-4 py-3 text-muted">{m.descricao ?? "—"}</td>
            <td className="px-4 py-3">
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  m.ativo ? "bg-teal/15 text-teal" : "bg-paper/10 text-muted"
                }`}
              >
                {m.ativo ? "Ativo" : "Inativo"}
              </span>
            </td>
            <td className="px-4 py-3 text-right">
              <div className="flex justify-end gap-3">
                <Link
                  href={`/dashboard/ministerios/${m.id}`}
                  className="text-xs text-amber hover:underline"
                >
                  Editar
                </Link>
                <form action={removerMinisterioAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="text-xs text-red-400 hover:underline">
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
