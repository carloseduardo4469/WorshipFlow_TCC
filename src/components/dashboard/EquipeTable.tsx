"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Usuario } from "@/types/domain";

const nomesHabilidades: Record<string, string> = {
  violao: "Violão",
  guitarra: "Guitarra",
  bateria: "Bateria",
  teclado: "Teclado",
  baixo: "Baixo",
  "voz-principal": "Voz principal",
  "voz-secundaria": "Voz secundária",
};

function habilidadesFormatadas(usuario: Usuario) {
  return (usuario.habilidades ?? "")
    .split(",")
    .map((habilidade) => habilidade.trim())
    .filter(Boolean)
    .map((habilidade) => nomesHabilidades[habilidade] ?? habilidade)
    .join(", ") || "Não informado";
}

export function EquipeTable({ usuarios }: { usuarios: Usuario[] }) {
  const [selecionado, setSelecionado] = useState<Usuario | null>(null);

  useEffect(() => {
    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelecionado(null);
    }
    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, []);

  return (
    <>
      <div className="db-card db-data-table db-responsive-table p-2 sm:p-3">
        <table className="db-table w-full text-left text-sm">
          <thead className="bg-white/[0.035] text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3 font-medium">Nome</th><th className="px-4 py-3 font-medium">Instrumentos</th><th className="px-4 py-3 font-medium">Status</th></tr></thead>
          <tbody className="divide-y divide-[color:rgba(148,163,184,0.1)]">
            {usuarios.map((usuario) => <tr key={usuario.id} role="button" tabIndex={0} onClick={() => setSelecionado(usuario)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelecionado(usuario); } }} className="db-responsive-row cursor-pointer transition hover:bg-cyan-300/[.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"><td data-label="Nome" className="px-4 py-3.5 text-paper font-medium">{usuario.nome}</td><td data-label="Instrumentos" className="px-4 py-3.5 text-muted">{habilidadesFormatadas(usuario)}</td><td data-label="Status" className="px-4 py-3.5"><span className={usuario.statusMinisterio === "ATIVO" ? "db-badge db-badge-green" : "db-badge db-badge-muted"}>{usuario.statusMinisterio === "ATIVO" ? "Ativo" : "Inativo"}</span></td></tr>)}
          </tbody>
        </table>
      </div>

      {selecionado && <div role="presentation" className="fixed inset-0 z-[70] flex items-center justify-center bg-[#020817]/70 p-4 backdrop-blur-sm" onMouseDown={() => setSelecionado(null)}><section role="dialog" aria-modal="true" aria-labelledby="perfil-equipe-titulo" className="db-member-modal relative w-full max-w-md p-6 sm:p-7" onMouseDown={(event) => event.stopPropagation()}><button type="button" onClick={() => setSelecionado(null)} aria-label="Fechar detalhes" className="db-icon-button absolute right-4 top-4 h-9 w-9"><X size={18} /></button><p className="db-label text-cyan-300">Perfil da equipe</p><h2 id="perfil-equipe-titulo" className="db-title mt-3 pr-10 text-4xl text-paper">{selecionado.nome}</h2><dl className="mt-7 grid gap-4"><div><dt className="db-label">Habilidades</dt><dd className="mt-1 text-base font-semibold text-paper">{habilidadesFormatadas(selecionado)}</dd></div><div><dt className="db-label">Status</dt><dd className="mt-2"><span className={selecionado.statusMinisterio === "ATIVO" ? "db-badge db-badge-green" : "db-badge db-badge-muted"}>{selecionado.statusMinisterio === "ATIVO" ? "Ativo" : "Inativo"}</span></dd></div></dl></section></div>}
    </>
  );
}
