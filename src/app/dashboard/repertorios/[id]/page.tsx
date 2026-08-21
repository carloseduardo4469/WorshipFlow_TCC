import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { RepertorioForm } from "@/components/dashboard/RepertorioForm";

export default async function EditarRepertorioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const repos = await getRepositories();
  const [repertorio, musicas, ministerios] = await Promise.all([
    repos.repertorios.getById(Number(id)),
    repos.musicas.list(),
    repos.ministerios.list(),
  ]);
  if (!repertorio) notFound();

  return (
    <div>
      <PageHeader title={`Editar: ${repertorio.nome}`} />
      <RepertorioForm repertorio={repertorio} musicas={musicas} ministerios={ministerios} />
    </div>
  );
}
