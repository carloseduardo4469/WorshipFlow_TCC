import { requireAuth } from "@/lib/auth/session";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuth();

  return (
    <div className="db-bg relative flex min-h-screen">
      <div aria-hidden className="db-grid pointer-events-none fixed inset-0" />
      <DashboardNav perfil={profile.perfil} nome={profile.nome} />
      <main className="relative z-10 min-h-screen flex-1 px-8 py-8 sm:px-12 sm:py-10">
        {children}
      </main>
    </div>
  );
}
