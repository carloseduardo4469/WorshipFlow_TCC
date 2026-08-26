import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { cachedData } from "@/lib/db/cache";
import { EscalasManager } from "@/components/dashboard/EscalasManager";

export default async function RegistrosEscalasPage() {
  await requireAdmin();
  const repos = await getRepositories();
  const [escalas, usuarios, musicas, ministerios] = await Promise.all([
    cachedData("escalas:list", () => repos.escalas.list()),
    cachedData("usuarios:list", () => repos.usuarios.list()),
    cachedData("musicas:list", () => repos.musicas.list()),
    cachedData("ministerios:list", () => repos.ministerios.list()),
  ]);

  return (
    <div className="mx-auto max-w-[1240px]">
      <EscalasManager escalas={escalas} usuarios={usuarios} musicas={musicas} ministerios={ministerios} />
    </div>
  );
}
