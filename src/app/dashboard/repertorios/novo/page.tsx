import { requireAdmin } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { RepertorioForm } from "@/components/dashboard/RepertorioForm";

export default async function NovoRepertorioPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-[760px] lg:mx-0">
      <PageHeader title="Novo repertório" />
      <RepertorioForm />
    </div>
  );
}
