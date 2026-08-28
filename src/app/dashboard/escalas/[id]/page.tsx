import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { EscalaForm } from "@/components/dashboard/EscalaForm";

export default async function EditarEscalaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const repos = await getRepositories();
  const [escala, usuarios, ministerios] = await Promise.all([
    repos.escalas.getById(Number(id)),
    repos.usuarios.list(),
    repos.ministerios.list(),
  ]);
  if (!escala) notFound();

  return (
    <div className="mx-auto max-w-[860px] lg:mx-0">
      <PageHeader title={`Editar: ${escala.titulo}`} />
      <EscalaForm escala={escala} usuarios={usuarios} ministerios={ministerios} />
    </div>
  );
}
