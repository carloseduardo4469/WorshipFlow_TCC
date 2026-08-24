import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { MusicaForm } from "@/components/dashboard/MusicaForm";

export default async function EditarMusicaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const repos = await getRepositories();
  const [musica, ministerios] = await Promise.all([
    repos.musicas.getById(Number(id)),
    repos.ministerios.list(),
  ]);
  if (!musica) notFound();

  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader title={`Editar: ${musica.titulo}`} />
      <MusicaForm musica={musica} ministerios={ministerios} />
    </div>
  );
}
