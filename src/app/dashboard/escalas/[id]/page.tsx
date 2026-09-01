import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { EscalaForm } from "@/components/dashboard/EscalaForm";

export default async function EditarEscalaPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAdmin();
  const { id } = await params;

  const repos = await getRepositories();
  const escala = await repos.escalas.getById(Number(id));
  if (!escala || profile.ministerioId === null || escala.ministerioId !== profile.ministerioId) notFound();
  const usuarios = (await repos.usuarios.getByIds(escala.usuarioIds)).filter((usuario) => usuario.ministerioId === profile.ministerioId);

  return (
    <div className="mx-auto max-w-[860px] lg:mx-0">
      <PageHeader title={`Editar: ${escala.titulo}`} />
      <EscalaForm escala={escala} usuarios={usuarios} />
    </div>
  );
}
