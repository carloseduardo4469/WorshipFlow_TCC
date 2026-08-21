import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { MinisterioForm } from "@/components/dashboard/MinisterioForm";

export default async function EditarMinisterioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const repos = await getRepositories();
  const ministerio = await repos.ministerios.getById(Number(id));
  if (!ministerio) notFound();

  return (
    <div>
      <PageHeader title={`Editar: ${ministerio.nome}`} />
      <MinisterioForm ministerio={ministerio} />
    </div>
  );
}
