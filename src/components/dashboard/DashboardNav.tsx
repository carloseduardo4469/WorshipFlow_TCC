"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import type { PerfilUsuario } from "@/types/domain";

const USER_NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Início" },
  { href: "/dashboard/escalas", label: "Escalas" },
  { href: "/dashboard/musicas", label: "Músicas" },
  { href: "/dashboard/repertorios", label: "Repertórios" },
  { href: "/dashboard/perfil", label: "Meu perfil" },
];

const ADMIN_NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/dashboard/ministerios", label: "Ministérios" },
  { href: "/dashboard/usuarios", label: "Equipe" },
];

function NavGroup({ items, pathname }: { items: { href: string; label: string }[]; pathname: string }) {
  return (
    <>
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              active ? "bg-paper/10 text-paper" : "text-muted hover:bg-paper/5 hover:text-paper"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function DashboardNav({ perfil, nome }: { perfil: PerfilUsuario; nome: string }) {
  const pathname = usePathname();
  const isAdmin = perfil === "ADMIN";

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col justify-between border-r border-paper/10 bg-ink px-4 py-6">
      <div>
        <div className="mb-8 px-2">
          <p className="font-display text-lg font-bold text-paper">WorshipFlow</p>
          <p className="text-xs text-muted">{nome}</p>
        </div>

        <nav className="flex flex-col gap-1">
          <NavGroup items={USER_NAV_ITEMS} pathname={pathname} />

          {isAdmin && (
            <>
              <div className="my-3 border-t border-paper/10" />
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Administração
              </p>
              <NavGroup items={ADMIN_NAV_ITEMS} pathname={pathname} />
            </>
          )}
        </nav>
      </div>

      <form action={logoutAction}>
        <button
          type="submit"
          aria-label="Sair da conta"
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-amber/10 hover:text-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <span className="flex items-center gap-2">
            <LogOut size={16} />
            Sair
          </span>
        </button>
      </form>
    </aside>
  );
}