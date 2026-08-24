"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import type { PerfilUsuario } from "@/types/domain";
import logo from "@/app/icon.png";

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
            className={`group relative flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-all ${
              active
                ? "bg-amber/10 text-amber"
                : "text-[color:rgba(244,241,233,0.55)] hover:bg-white/5 hover:text-paper"
            }`}
          >
            {active && <span className="absolute left-0 h-4 w-[3px] -translate-x-1 translate-y-0.5 rounded-full bg-amber" />}
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
    <aside className="db-bg relative flex h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-[color:rgba(148,163,184,0.12)] px-5 py-7">
      <div aria-hidden className="db-grid pointer-events-none absolute inset-0" />

      <div>
        <div className="relative mb-9 flex items-center gap-3 px-1">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-amber/40 shadow-[0_6px_22px_-6px_rgba(232,163,61,0.6)]">
            <Image src={logo} alt="" fill sizes="44px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="db-title text-xl font-extrabold leading-none text-paper">WorshipFlow</p>
            <p className="mt-1 truncate text-xs text-[color:rgba(232,241,233,0.55)]">{nome}</p>
          </div>
        </div>

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
      </div>

      <form action={logoutAction}>
        <button
          type="submit"
          aria-label="Sair da conta"
          className="group flex w-full items-center gap-2 rounded-full border border-[color:rgba(148,163,184,0.16)] bg-white/3 px-3 py-2 text-sm text-[color:rgba(232,241,233,0.6)] transition hover:border-red-400/50 hover:text-red-300"
        >
          <LogOut size={15} />
          <span>Sair</span>
        </button>
      </form>
    </aside>
  );
}