import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { EscalasManager } from "@/components/dashboard/EscalasManager";
import { firstUsuariosPageCached, listEscalasCached } from "@/lib/db/queries";
import { concluirEscalasVencidas } from "@/lib/escalas/status-automatico";

const TAMANHO_PAGINA_USUARIOS = 20;

export default async function RegistrosEscalasPage() {
  await requireAdmin();
  const repos = await getRepositories();
  const escalas = await concluirEscalasVencidas(repos, await listEscalasCached(repos));
  const usuarioIds = [...new Set(escalas.flatMap((escala) => escala.usuarioIds))];
  const [usuariosReferenciados, resultadoUsuariosIniciais] = await Promise.all([
    repos.usuarios.getByIds(usuarioIds),
    firstUsuariosPageCached(repos, TAMANHO_PAGINA_USUARIOS + 1),
  ]);

  return (
    <div className="db-schedule-page mx-auto max-w-[1240px]">
      <EscalasManager
        escalas={escalas}
        usuariosReferenciados={usuariosReferenciados}
        usuariosIniciais={resultadoUsuariosIniciais.slice(0, TAMANHO_PAGINA_USUARIOS)}
        temMaisUsuariosInicial={resultadoUsuariosIniciais.length > TAMANHO_PAGINA_USUARIOS}
      />
    </div>
  );
}
