import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { RepertorioForm } from "@/components/dashboard/RepertorioForm";

export default async function NovoRepertorioPage() {
  await requireAdmin();
  const repos = await getRepositories();
  const ministerios = await repos.ministerios.list();

  return (
    <div className="mx-auto max-w-[760px] lg:mx-0">
      <PageHeader title="Novo repertório" />
      <RepertorioForm ministerios={ministerios} />
    </div>
  );
}
