import { requireAdmin } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { EscalaForm } from "@/components/dashboard/EscalaForm";

export default async function NovaEscalaPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-[860px] lg:mx-0">
      <PageHeader title="Nova escala" />
      <EscalaForm usuarios={[]} />
    </div>
  );
}
