import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { removerEscalaAction } from "@/lib/actions/escalas";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

export default async function EscalasPage() {
  const { profile } = await requireAuth();
  const repos = await getRepositories();
  const [escalas, usuarios] = await Promise.all([repos.escalas.list(), repos.usuarios.list()]);
  const isAdmin = profile.perfil === "ADMIN";

  const nomesPorId = new Map(usuarios.map((u) => [u.id, u.nome]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageHeader title="Escalas" description="Programação de equipes por culto/ensaio." />
        {isAdmin && (
          <Link href="/dashboard/escalas/novo">
            <Button>Nova escala</Button>
          </Link>
        )}
      </div>

      <DataTable
        headers={["Título", "Data", "Status", "Equipe", ""]}
        isEmpty={escalas.length === 0}
        emptyMessage="Nenhuma escala cadastrada ainda."
      >
        {escalas.map((e) => (
          <tr key={e.id}>
            <td className="px-4 py-3 text-paper">{e.titulo}</td>
            <td className="px-4 py-3 text-muted">{formatDate(e.dataEscala)}</td>
            <td className="px-4 py-3">
              <StatusBadge status={e.status} />
            </td>
            <td className="px-4 py-3 text-muted">
              {e.usuarioIds.length === 0
                ? "—"
                : e.usuarioIds.map((id) => nomesPorId.get(id) ?? "?").join(", ")}
            </td>
            <td className="px-4 py-3 text-right">
              {isAdmin && (
                <div className="flex justify-end gap-3">
                  <Link
                    href={`/dashboard/escalas/${e.id}`}
                    className="text-xs text-amber hover:underline"
                  >
                    Editar
                  </Link>
                  <form action={removerEscalaAction}>
                    <input type="hidden" name="id" value={e.id} />
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
