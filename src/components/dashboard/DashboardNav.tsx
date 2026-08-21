"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import type { PerfilUsuario } from "@/types/domain";

const NAV_ITEMS: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: "/dashboard", label: "Início" },
  { href: "/dashboard/escalas", label: "Escalas" },
  { href: "/dashboard/musicas", label: "Músicas" },
  { href: "/dashboard/repertorios", label: "Repertórios" },
  { href: "/dashboard/ministerios", label: "Ministérios", adminOnly: true },
  { href: "/dashboard/usuarios", label: "Equipe", adminOnly: true },
  { href: "/dashboard/perfil", label: "Meu perfil" },
];

export function DashboardNav({ perfil, nome }: { perfil: PerfilUsuario; nome: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col justify-between border-r border-paper/10 bg-ink px-4 py-6">
      <div>
        <div className="mb-8 px-2">
          <p className="font-display text-lg font-bold text-paper">WorshipFlow</p>
          <p className="text-xs text-muted">{nome}</p>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.filter((item) => !item.adminOnly || perfil === "ADMIN").map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? "bg-paper/10 text-paper" : "text-muted hover:bg-paper/5 hover:text-paper"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <form action={logoutAction}>
        <button
          type="submit"
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-paper/5 hover:text-paper"
        >
          Sair
        </button>
      </form>
    </aside>
  );
}
