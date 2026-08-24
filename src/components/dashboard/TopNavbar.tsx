"use client";

import Link from "next/link";
import { LogOut, Sparkles } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import type { Usuario } from "@/types/domain";
import { DashboardThemeToggle } from "./DashboardThemeToggle";

function Avatar({ usuario }: { usuario: Usuario }) {
  const initials = usuario.nome.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join("");
  return usuario.fotoPerfilUrl ? <img src={usuario.fotoPerfilUrl} alt={usuario.nome} className="h-8 w-8 rounded-full object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#e9d375] to-[#5ccee0] text-xs font-bold text-[#07101e]">{initials}</span>;
}

export function TopNavbar({ usuario }: { usuario: Usuario }) {
  const firstName = usuario.nome.split(" ")[0];
  return <header className="relative z-20 hidden h-20 items-center justify-between border-b border-white/10 bg-[#070d1a]/75 px-7 backdrop-blur lg:flex"><div><p className="db-label !text-[10px] text-[#c3cbd7]">Painel · Ministério de louvor</p><h1 className="db-title mt-1 text-[30px] leading-none text-[#f7f6f2]">Dashboard ministerial</h1></div><div className="flex items-center gap-2"><DashboardThemeToggle /><Link href="/dashboard/perfil" className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] py-1 pl-1 pr-4 text-sm font-semibold text-[#f1f2ef] transition hover:border-cyan-300/45"><Avatar usuario={usuario} /><span>{firstName}</span><Sparkles size={14} className="text-[#f4d25e]" /></Link><form action={logoutAction}><button type="submit" aria-label="Sair" className="db-icon-button"><LogOut size={18} /></button></form></div></header>;
}
