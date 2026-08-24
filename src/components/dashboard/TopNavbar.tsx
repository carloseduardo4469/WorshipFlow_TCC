"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import logo from "@/app/icon.png";
import { logoutAction } from "@/lib/actions/auth";
import type { Usuario } from "@/types/domain";

function Avatar({ usuario }: { usuario: Usuario }) {
  const initials = usuario.nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

  if (usuario.fotoPerfilUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={usuario.fotoPerfilUrl}
        alt={usuario.nome}
        className="h-10 w-10 rounded-full object-cover ring-1 ring-amber/40"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#34246e] to-[#10495b] font-mono text-sm font-bold text-[#f4f1e9] ring-1 ring-amber/40">
      {initials}
    </div>
  );
}

/**
 * Barra superior do dashboard: marca à esquerda e, à direita, o avatar do
 * perfil e o botão de saída — como no design do projeto antigo.
 */
export function TopNavbar({ usuario }: { usuario: Usuario }) {
  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center justify-between border-b border-[color:rgba(148,163,184,0.12)] bg-[#0a1122]/85 px-5 backdrop-blur sm:px-8">
      <div className="flex items-center gap-3">
        <div className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-amber/30">
          <Image src={logo} alt="" fill sizes="32px" className="object-cover" />
        </div>
        <div className="leading-tight">
          <p className="db-title text-base font-extrabold leading-none text-paper">WorshipFlow</p>
          <p className="af-label mt-1 !text-[9px] text-[#97a3bd]">Ministério de louvor</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/dashboard/perfil"
          className="group flex items-center gap-3 rounded-full border border-[color:rgba(148,163,184,0.14)] bg-white/[0.03] py-1.5 pl-1.5 pr-4 transition hover:border-amber/40"
        >
          <Avatar usuario={usuario} />
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-paper">{usuario.nome}</p>
            <p className="text-[11px] text-muted">
              {usuario.perfil === "ADMIN" ? "Administrador" : "Membro"}
            </p>
          </div>
        </Link>

        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="Sair da página"
            title="Sair da página"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:rgba(148,163,184,0.16)] bg-white/[0.03] text-muted transition hover:border-red-400/50 hover:text-red-300"
          >
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </header>
  );
}