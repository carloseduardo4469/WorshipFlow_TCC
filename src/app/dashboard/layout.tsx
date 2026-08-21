import { requireAuth } from "@/lib/auth/session";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuth();

  return (
    <div className="flex bg-ink">
      <DashboardNav perfil={profile.perfil} nome={profile.nome} />
      <main className="min-h-screen flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
