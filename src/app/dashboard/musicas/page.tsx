import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { MusicasManager } from "@/components/dashboard/MusicasManager";
import { getRepositories } from "@/lib/db/repositories";
import { firstMusicasPageCached } from "@/lib/db/queries";

const TAMANHO_PAGINA = 25;

export default async function MusicasPage() {
  const { profile } = await requireAuth();
  const isAdmin = profile.perfil === "ADMIN";
  const repos = await getRepositories();
  const resultadoInicial = await firstMusicasPageCached(
    repos,
    TAMANHO_PAGINA + 1
  );

  return (
    <div className="mx-auto max-w-[1240px]">
      <PageHeader title="Músicas" description="Repertório musical do ministério." />
      <MusicasManager
        isAdmin={isAdmin}
        musicasIniciais={resultadoInicial.slice(0, TAMANHO_PAGINA)}
        temMaisInicial={resultadoInicial.length > TAMANHO_PAGINA}
      />
    </div>
  );
}
