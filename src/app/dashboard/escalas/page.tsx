import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { removerEscalaAction } from "@/lib/actions/escalas";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function EscalasPage() {
  const { profile } = await requireAuth();
  const repos = await getRepositories();
  const [escalas, usuarios] = await Promise.all([repos.escalas.list(), repos.usuarios.list()]);
  const isAdmin = profile.perfil === "ADMIN";

  const nomesPorId = new Map(usuarios.map((u) => [u.id, u.nome]));

  return (
    <div>
      <div className="mb-7 flex items-center justify-between gap-4">
        <PageHeader title="Escalas" description="Programação de equipes por cultos e compromissos." />
        {isAdmin && (
          <Link href="/dashboard/escalas/novo" className="db-cta">
            <Plus size={16} />
            Nova escala
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
            <td className="px-4 py-3.5 text-paper font-medium">{e.titulo}</td>
            <td className="px-4 py-3.5 text-muted">{formatDate(e.dataEscala)}</td>
            <td className="px-4 py-3.5">
              <StatusBadge status={e.status} />
            </td>
            <td className="px-4 py-3.5 text-muted">
              {e.usuarioIds.length === 0
                ? "—"
                : e.usuarioIds.map((id) => nomesPorId.get(id) ?? "?").join(", ")}
            </td>
            <td className="px-4 py-3.5 text-right">
              {isAdmin && (
                <div className="flex justify-end gap-3">
                  <Link href={`/dashboard/escalas/${e.id}`} className="db-btn-sm">
                    Editar
                  </Link>
                  <form action={removerEscalaAction}>
                    <input type="hidden" name="id" value={e.id} />
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
