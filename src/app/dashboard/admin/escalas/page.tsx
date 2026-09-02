import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { EscalasManager } from "@/components/dashboard/EscalasManager";
import { listEscalasCached } from "@/lib/db/queries";
import { concluirEscalasVencidas } from "@/lib/escalas/status-automatico";

export default async function RegistrosEscalasPage() {
  await requireAdmin();
  const repos = await getRepositories();
  const escalas = await concluirEscalasVencidas(repos, await listEscalasCached(repos));
  const usuarioIds = [...new Set(escalas.flatMap((escala) => escala.usuarioIds))];
  const usuarios = await repos.usuarios.getByIds(usuarioIds);

  return (
    <div className="db-schedule-page mx-auto max-w-[1240px]">
      <EscalasManager escalas={escalas} usuarios={usuarios} />
    </div>
  );
}
