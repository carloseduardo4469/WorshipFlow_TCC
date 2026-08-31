import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { cachedData } from "@/lib/db/cache";
import { PageHeader } from "@/components/ui/PageHeader";
import { EscalasTable } from "@/components/dashboard/EscalasTable";

function hojeIso() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
}

export default async function EscalasPage() {
  await requireAuth();
  const repos = await getRepositories();
  const [escalas, ministerios] = await Promise.all([
    cachedData("escalas:list", () => repos.escalas.list()),
    cachedData("ministerios:list", () => repos.ministerios.list()),
  ]);
  const hoje = hojeIso();
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
        : <EscalasTable escalas={proximasEscalas} usuarios={usuarios} ministerios={ministerios} />}
    </div>
  );
}
