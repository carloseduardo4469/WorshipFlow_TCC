"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Church,
  Home,
  ListMusic,
  Music,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { PerfilUsuario } from "@/types/domain";

type NavItem = { href: string; label: string; icon: LucideIcon };

const USER_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/dashboard/escalas", label: "Escalas", icon: CalendarDays },
  { href: "/dashboard/musicas", label: "Músicas", icon: Music },
  { href: "/dashboard/repertorios", label: "Repertórios", icon: ListMusic },
  { href: "/dashboard/perfil", label: "Meu perfil", icon: User },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/ministerios", label: "Ministérios", icon: Church },
  { href: "/dashboard/usuarios", label: "Equipe", icon: Users },
];

function NavGroup({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={`group relative flex items-center gap-3 rounded-full px-3.5 py-2 text-sm transition-all ${
              active
                ? "bg-amber/10 font-semibold text-amber"
                : "text-[color:rgba(244,241,233,0.55)] hover:bg-white/5 hover:text-paper"
            }`}
          >
            {active && (
              <span className="absolute left-0 h-5 w-[3px] -translate-x-2 rounded-full bg-amber" />
            )}
            <Icon size={16} className={active ? "text-amber" : "text-muted"} />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function DashboardNav({ perfil }: { perfil: PerfilUsuario }) {
  const pathname = usePathname();
  const isAdmin = perfil === "ADMIN";

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-[color:rgba(148,163,184,0.12)] px-4 py-7">
      <p className="af-label mb-5 px-3 text-[#97a3bd]">Menu</p>

      <nav className="flex flex-col gap-1.5">
        <NavGroup items={USER_NAV_ITEMS} pathname={pathname} />

        {isAdmin && (
          <>
            <div className="my-3 px-3 text-[10px] uppercase tracking-[0.2em] text-[color:rgba(151,163,189,0.6)]">
              Administração
            </div>
            <NavGroup items={ADMIN_NAV_ITEMS} pathname={pathname} />
          </>
        )}
      </nav>
    </aside>
  );
}