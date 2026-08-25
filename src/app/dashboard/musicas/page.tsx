import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { cachedData } from "@/lib/db/cache";
import { PageHeader } from "@/components/ui/PageHeader";
import { MusicasManager } from "@/components/dashboard/MusicasManager";

export default async function MusicasPage() {
  const { profile } = await requireAuth();
  const repos = await getRepositories();
  const [musicas, ministerios] = await Promise.all([
    cachedData("musicas:list", () => repos.musicas.list()),
    cachedData("ministerios:list", () => repos.ministerios.list()),
  ]);
  const isAdmin = profile.perfil === "ADMIN";

  return (
    <div className="mx-auto max-w-[1240px]">
      <PageHeader title="Músicas" description="Repertório musical do ministério." />
      <MusicasManager musicas={musicas} ministerios={ministerios} isAdmin={isAdmin} />
    </div>
  );
}
