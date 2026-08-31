import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { HistoricoCalendar } from "@/components/dashboard/HistoricoCalendar";
import { concluirEscalasVencidas, hojeEmSaoPaulo } from "@/lib/escalas/status-automatico";

export default async function HistoricoPage() {
  await requireAuth();
  const repos = await getRepositories();
  const escalas = await concluirEscalasVencidas(repos, await repos.escalas.list());
  const limite = hojeEmSaoPaulo();
  const historico = escalas.filter((escala) =>
    escala.status === "CONCLUIDA" && Boolean(escala.dataEscala && escala.dataEscala < limite)
  );
  const usuarioIds = [...new Set(historico.flatMap((escala) => escala.usuarioIds))];
  const usuarios = await repos.usuarios.getByIds(usuarioIds);

  return (
    <div className="db-schedule-page mx-auto max-w-[1240px]">
      <PageHeader title="Histórico" description="Escalas concluídas ou que já passaram da data programada." />
      <HistoricoCalendar escalas={historico} usuarios={usuarios} hoje={limite} />
    </div>
  );
}
