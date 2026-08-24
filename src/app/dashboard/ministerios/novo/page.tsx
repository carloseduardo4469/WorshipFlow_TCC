import { requireAdmin } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { MinisterioForm } from "@/components/dashboard/MinisterioForm";

export default async function NovoMinisterioPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader title="Novo ministério" />
      <MinisterioForm />
    </div>
  );
}
