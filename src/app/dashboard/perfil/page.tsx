import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { PerfilForm } from "@/components/dashboard/PerfilForm";
import { PerfilLogoutButton } from "@/components/dashboard/PerfilLogoutButton";

export default async function PerfilPage() {
  const { profile, email } = await requireAuth();

  return (
    <div className="db-profile-page mx-auto max-w-[760px]">
      <PageHeader title="Meu perfil" description={email} action={<PerfilLogoutButton />} />
      <PerfilForm usuario={profile} />
    </div>
  );
}
