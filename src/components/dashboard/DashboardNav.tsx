"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  History,
  Home,
  Menu,
  Music2,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import logo from "@/app/icon.webp";
import type { PerfilUsuario, Usuario } from "@/types/domain";
import { DashboardThemeToggle } from "./DashboardThemeToggle";

type NavItem = { href: string; label: string; icon: LucideIcon };

const memberItems: NavItem[] = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/dashboard/perfil", label: "Perfil", icon: UserRound },
  { href: "/dashboard/equipe", label: "Equipe", icon: UsersRound },
  { href: "/dashboard/musicas", label: "Músicas", icon: Music2 },
  { href: "/dashboard/escalas", label: "Escalas", icon: CalendarDays },
  { href: "/dashboard/historico", label: "Histórico", icon: History },
];
const adminItems: NavItem[] = [
  { href: "/dashboard/admin/usuarios", label: "Registros de usuários", icon: UsersRound },
  { href: "/dashboard/admin/escalas", label: "Registro de escalas", icon: ClipboardList },
];
const mobileItems = [memberItems[0], memberItems[2], memberItems[3], memberItems[4], memberItems[1]];
const activePath = (pathname: string, href: string) =>
  href === "/dashboard" ? pathname === href : pathname.startsWith(href);

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-1">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-1 ring-cyan-300/20">
        <Image src={logo} alt="WorshipFlow" fill sizes="48px" className="object-cover" priority />
      </div>
      <div>
        <p className="db-brand-title db-title whitespace-nowrap text-[25px] leading-none">WorshipFlow</p>
        <p className="db-brand-subtitle db-label mt-1.5 !text-[8px] !tracking-[0.28em]">Ministério de louvor</p>
      </div>
    </Link>
  );
}

function ProfileAvatar({ usuario }: { usuario: Usuario }) {
  const iniciais = usuario.nome.split(" ").filter(Boolean).slice(0, 2)
    .map((parte) => parte[0]!.toUpperCase()).join("");
  return (
    <Link href="/dashboard/perfil" aria-label="Abrir perfil" className="db-icon-button h-10 w-10 overflow-hidden p-0">
      {usuario.fotoPerfilUrl ? (
        <Image src={usuario.fotoPerfilUrl} alt={usuario.nome} width={40} height={40} sizes="40px" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e9d375] to-[#5ccee0] text-xs font-bold text-[#07101e]">
          {iniciais}
        </span>
      )}
    </Link>
  );
}

function NavLinks({ items, pathname, onClick }: { items: NavItem[]; pathname: string; onClick?: () => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map(({ href, label, icon: Icon }) => (
        <Link key={`${href}-${label}`} href={href} onClick={onClick} className={`db-nav-link ${activePath(pathname, href) ? "db-nav-link-active" : ""}`}>
          <Icon size={19} strokeWidth={1.8} /><span>{label}</span>
        </Link>
      ))}
    </div>
  );
}

function NavigationContent({ perfil, onClick }: { perfil: PerfilUsuario; onClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="mt-9">
      <p className="db-label mb-3 px-3 !text-[9px] text-[#aeb8ca]">Membro</p>
      <NavLinks items={memberItems} pathname={pathname} onClick={onClick} />
      {perfil === "ADMIN" && <><p className="db-label mb-3 mt-9 px-3 !text-[9px] text-[#aeb8ca]">Administrador</p><NavLinks items={adminItems} pathname={pathname} onClick={onClick} /></>}
    </nav>
  );
}

export function DashboardNav({ perfil, usuario }: { perfil: PerfilUsuario; usuario: Usuario }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const fecharComEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", fecharComEscape);
    return () => document.removeEventListener("keydown", fecharComEscape);
  }, [open]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[278px] border-r border-white/10 bg-[#071525]/95 px-3 py-5 lg:block"><Brand /><NavigationContent perfil={perfil} /></aside>
      <div className="db-mobile-header fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#07101e]/90 px-4 backdrop-blur lg:hidden">
        <Brand />
        <div className="flex shrink-0 items-center gap-2"><DashboardThemeToggle compact /><ProfileAvatar usuario={usuario} /><button type="button" aria-label="Abrir menu" onClick={() => setOpen(true)} className="db-icon-button h-10 w-10"><Menu size={20} /></button></div>
      </div>

      {open && (
        <div className="db-drawer-layer lg:hidden">
          <button type="button" aria-label="Fechar menu" className="db-drawer-backdrop" onClick={() => setOpen(false)} />
          <aside className="db-mobile-drawer fixed inset-y-0 left-0 z-[51] w-[min(82vw,320px)] overflow-y-auto border-r border-white/10 bg-[#071525] px-3 py-5">
            <div className="flex items-center justify-between"><Brand /><button type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} className="db-icon-button h-9 w-9"><X size={18} /></button></div>
            <NavigationContent perfil={perfil} onClick={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <nav aria-label="Navegação principal" className="db-mobile-nav fixed inset-x-0 bottom-0 z-[60] grid h-[calc(70px+env(safe-area-inset-bottom))] grid-cols-5 border-t px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
        {mobileItems.map(({ href, label, icon: Icon }) => {
          const active = activePath(pathname, href);
          return <Link key={href} href={href} className={`db-mobile-nav-link ${active ? "db-mobile-nav-link-active" : ""}`}><Icon size={20} strokeWidth={active ? 2.4 : 1.9} /><span>{label}</span></Link>;
        })}
      </nav>
    </>
  );
}
