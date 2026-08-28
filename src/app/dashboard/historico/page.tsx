import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { cachedData } from "@/lib/db/cache";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function hojeIso() {
  const hoje = new Date();
  return [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, "0"),
    String(hoje.getDate()).padStart(2, "0"),
  ].join("-");
}

export default async function RepertoriosPage() {
  const { profile } = await requireAuth();
  const repos = await getRepositories();
  const escalas = await cachedData("escalas:list", () => repos.escalas.list());
  const limite = hojeIso();
  const historico = escalas.filter(
    (escala) => escala.status === "CONCLUIDA" || Boolean(escala.dataEscala && escala.dataEscala < limite)
  );

  return (
    <div className="mx-auto max-w-[1240px]">
      <div className="db-page-toolbar">
        <PageHeader title="Histórico" description="Escalas concluídas ou que já passaram da data programada." />
      </div>

      <DataTable
        headers={["Escala", "Data", "Status", "Equipe"]}
        isEmpty={historico.length === 0}
        emptyMessage="Nenhuma escala concluída ou passada ainda."
      >
        {historico.map((escala) => (
          <tr key={escala.id}>
            <td className="px-4 py-3.5 text-paper font-medium">{escala.titulo}</td>
            <td className="px-4 py-3.5 text-muted">{formatDate(escala.dataEscala)}</td>
            <td className="px-4 py-3.5"><StatusBadge status={escala.status} /></td>
            <td className="px-4 py-3.5 text-muted">{escala.usuarioIds.length} membro(s)</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
