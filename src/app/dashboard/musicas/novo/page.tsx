import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { MusicaForm } from "@/components/dashboard/MusicaForm";

export default async function NovaMusicaPage() {
  await requireAdmin();
  const repos = await getRepositories();
  const ministerios = await repos.ministerios.list();

  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader title="Nova música" />
      <MusicaForm ministerios={ministerios} />
    </div>
  );
}
