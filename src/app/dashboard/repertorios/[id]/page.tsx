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
  const repertorio = await repos.repertorios.getById(Number(id));
  if (!repertorio) notFound();

  return (
    <div className="mx-auto max-w-[760px] lg:mx-0">
      <PageHeader title={`Editar: ${repertorio.nome}`} />
      <RepertorioForm repertorio={repertorio} />
    </div>
  );
}
