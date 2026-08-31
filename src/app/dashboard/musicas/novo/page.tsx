import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { MusicaForm } from "@/components/dashboard/MusicaForm";

export default async function NovaMusicaPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-[760px] lg:mx-0">
      <PageHeader title="Nova música" />
      <MusicaForm />
    </div>
  );
}
