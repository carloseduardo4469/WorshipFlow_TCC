import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { concluirEscalasVencidas, hojeEmSaoPaulo } from "@/lib/escalas/status-automatico";
import { PageHeader } from "@/components/ui/PageHeader";
import { EscalasTable } from "@/components/dashboard/EscalasTable";
import { listEscalasCached } from "@/lib/db/queries";

export default async function EscalasPage() {
  const { authId } = await requireAuth();
  const repos = await getRepositories();
  const escalas = await concluirEscalasVencidas(repos, await listEscalasCached(repos));
  const hoje = hojeEmSaoPaulo();
  const proximasEscalas = escalas.filter((escala) =>
    escala.status === "PUBLICADA" && (!escala.dataEscala || escala.dataEscala >= hoje)
  );
  const usuarioIds = [...new Set(proximasEscalas.flatMap((escala) => escala.usuarioIds))];
  const usuarios = await repos.usuarios.getByIds(usuarioIds);
  return (
    <div className="db-schedule-page mx-auto max-w-[1240px]">
      <PageHeader title="Escalas" description="Próximas equipes publicadas para cultos e compromissos." />
      {proximasEscalas.length === 0
        ? <div className="db-empty db-empty-modern">Nenhuma próxima escala publicada.</div>
        : <EscalasTable escalas={proximasEscalas} usuarios={usuarios} currentUserId={authId} />}
    </div>
  );
}
