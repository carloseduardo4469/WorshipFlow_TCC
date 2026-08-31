import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { cachedData } from "@/lib/db/cache";
import { EscalasManager } from "@/components/dashboard/EscalasManager";

export default async function RegistrosEscalasPage() {
  await requireAdmin();
  const repos = await getRepositories();
  const escalas = await cachedData("escalas:list", () => repos.escalas.list());
  const usuarioIds = [...new Set(escalas.flatMap((escala) => escala.usuarioIds))];
  const usuarios = await repos.usuarios.getByIds(usuarioIds);

  return (
    <div className="db-schedule-page mx-auto max-w-[1240px]">
      <EscalasManager escalas={escalas} usuarios={usuarios} />
    </div>
  );
}
