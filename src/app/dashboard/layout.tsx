import { requireAuth } from "@/lib/auth/session";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { TopNavbar } from "@/components/dashboard/TopNavbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuth();

  return (
    <div className="db-bg relative min-h-screen">
      <div aria-hidden className="db-grid pointer-events-none fixed inset-0" />

      <TopNavbar usuario={profile} />

      <div className="relative z-10 flex">
        <DashboardNav perfil={profile.perfil} />
        <main className="min-h-[calc(100vh-4rem)] flex-1 px-6 py-8 sm:px-10 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
