import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { cachedData } from "@/lib/db/cache";
import { PageHeader } from "@/components/ui/PageHeader";
import { EscalasTable } from "@/components/dashboard/EscalasTable";

function hojeIso() {
  const hoje = new Date();
  return [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, "0"),
    String(hoje.getDate()).padStart(2, "0"),
  ].join("-");
}

export default async function HistoricoPage() {
  await requireAuth();
  const repos = await getRepositories();
  const escalas = await cachedData("escalas:list", () => repos.escalas.list());
  const limite = hojeIso();
  const historico = escalas.filter(
    (escala) => escala.status === "CONCLUIDA" || Boolean(escala.dataEscala && escala.dataEscala < limite)
  );
  const usuarioIds = [...new Set(historico.flatMap((escala) => escala.usuarioIds))];
  const usuarios = await repos.usuarios.getByIds(usuarioIds);

  return (
    <div className="db-schedule-page mx-auto max-w-[1240px]">
      <PageHeader title="Histórico" description="Escalas concluídas ou que já passaram da data programada." />
      {historico.length === 0
        ? <div className="db-empty db-empty-modern">Nenhuma escala concluída ou passada ainda.</div>
        : <EscalasTable escalas={historico} usuarios={usuarios} />}
    </div>
  );
}
