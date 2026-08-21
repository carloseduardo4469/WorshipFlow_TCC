import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { PerfilForm } from "@/components/dashboard/PerfilForm";

export default async function PerfilPage() {
  const { profile, email } = await requireAuth();

  return (
    <div>
      <PageHeader title="Meu perfil" description={email} />
      <PerfilForm usuario={profile} />
    </div>
  );
}
