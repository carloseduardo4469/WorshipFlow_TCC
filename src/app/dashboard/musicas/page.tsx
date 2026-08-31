import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { MusicasManager } from "@/components/dashboard/MusicasManager";

export default async function MusicasPage() {
  const { profile } = await requireAuth();
  const isAdmin = profile.perfil === "ADMIN";

  return (
    <div className="mx-auto max-w-[1240px]">
      <PageHeader title="Músicas" description="Repertório musical do ministério." />
      <MusicasManager isAdmin={isAdmin} />
    </div>
  );
}
