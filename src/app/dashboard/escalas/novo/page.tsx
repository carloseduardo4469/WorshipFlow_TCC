import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { EscalaForm } from "@/components/dashboard/EscalaForm";

export default async function NovaEscalaPage() {
  await requireAdmin();
  const repos = await getRepositories();
  const [usuarios, musicas, ministerios] = await Promise.all([
    repos.usuarios.list(),
    repos.musicas.list(),
    repos.ministerios.list(),
  ]);

  return (
    <div>
      <PageHeader title="Nova escala" />
      <EscalaForm usuarios={usuarios} musicas={musicas} ministerios={ministerios} />
    </div>
  );
}
