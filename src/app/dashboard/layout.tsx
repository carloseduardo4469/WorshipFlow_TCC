import { requireAuth } from "@/lib/auth/session";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { TopNavbar } from "@/components/dashboard/TopNavbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuth();

  return (
    <div className="db-bg relative min-h-screen">
      <div aria-hidden className="db-grid pointer-events-none fixed inset-0" />

      <div className="relative z-10 lg:pl-[278px]">
        <DashboardNav perfil={profile.perfil} />
        <TopNavbar usuario={profile} />
        <main className="min-h-screen px-4 pb-24 pt-20 sm:px-6 lg:px-7 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
