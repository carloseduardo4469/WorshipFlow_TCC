import { requireAdmin } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { MinisterioForm } from "@/components/dashboard/MinisterioForm";

export default async function NovoMinisterioPage() {
  await requireAdmin();
  return (
    <div>
      <PageHeader title="Novo ministério" />
      <MinisterioForm />
    </div>
  );
}
