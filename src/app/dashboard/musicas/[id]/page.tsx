import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { MusicaForm } from "@/components/dashboard/MusicaForm";

export default async function EditarMusicaPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;

  const repos = await getRepositories();
  const musica = await repos.musicas.getById(Number(id));
  if (!musica || profile.ministerioId === null || musica.ministerioId !== profile.ministerioId) notFound();

  return (
    <div className="mx-auto max-w-[760px] lg:mx-0">
      <PageHeader title={`Editar: ${musica.titulo}`} />
      <MusicaForm musica={musica} />
    </div>
  );
}
