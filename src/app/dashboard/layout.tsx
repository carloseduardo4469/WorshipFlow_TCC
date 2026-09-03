import "@/styles/dashboard-core.css";
import "@/styles/dashboard-components.css";
import "@/styles/dashboard-schedules.css";
import "@/styles/dashboard-mobile.css";
import "@/styles/dialogs.css";
import { requireAuth } from "@/lib/auth/session";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { TopNavbar } from "@/components/dashboard/TopNavbar";
import { PresenceTracker } from "@/components/dashboard/PresenceTracker";
import { SiteFooter } from "@/components/SiteFooter";
import { AutoSaveManager } from "@/components/dashboard/AutoSaveManager";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuth();

  return (
    <>
      <div className="db-bg relative min-h-screen">
        <div aria-hidden className="db-grid pointer-events-none fixed inset-0" />
        <PresenceTracker />
        <AutoSaveManager />
        <DashboardNav perfil={profile.perfil} usuario={profile} />

        <div className="relative lg:pl-[278px]">
          <TopNavbar usuario={profile} />
          <main className="db-dashboard-main min-h-screen px-4 pb-24 pt-20 sm:px-6 lg:px-7 lg:py-8">
            {children}
          </main>
        </div>
      </div>
      <SiteFooter dashboard />
    </>
  );
}
