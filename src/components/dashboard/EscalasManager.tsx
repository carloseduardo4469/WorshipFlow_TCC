"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { removerEscalaAction } from "@/lib/actions/escalas";
import { EscalaForm } from "./EscalaForm";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Escala, Ministerio, Musica, Usuario } from "@/types/domain";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EscalasManager({
  escalas,
  usuarios,
  musicas,
  ministerios,
}: {
  escalas: Escala[];
  usuarios: Usuario[];
  musicas: Musica[];
  ministerios: Ministerio[];
}) {
  const [escalaAberta, setEscalaAberta] = useState<Escala | "nova" | null>(null);
  const nomesPorId = new Map(usuarios.map((usuario) => [usuario.id, usuario.nome]));

  useEffect(() => {
    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setEscalaAberta(null);
    }
    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, []);

  return (
    <>
      <div className="db-page-toolbar">
        <div>
          <p className="db-label text-cyan-300">Planejamento</p>
          <h1 className="db-title mt-2 text-4xl text-paper">Registro de escalas</h1>
          <p className="mt-2 text-sm font-medium text-muted">Crie, edite e acompanhe a programação das equipes.</p>
        </div>
        <button type="button" onClick={() => setEscalaAberta("nova")} className="db-cta">
          <Plus size={16} />
          Nova escala
        </button>
      </div>

      <div className="db-card db-responsive-table p-3 sm:p-4">
        <table className="db-table w-full text-left text-sm">
          <thead className="bg-white/[0.035] text-xs uppercase tracking-wide text-muted">
            <tr>
              {['Título', 'Data', 'Status', 'Equipe', ''].map((header) => (
                <th key={header} className="px-4 py-3 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:rgba(148,163,184,0.1)]">
            {escalas.map((escala) => (
              <tr key={escala.id} className="db-responsive-row">
                <td data-label="Título" className="px-4 py-3.5 font-medium text-paper">{escala.titulo}</td>
                <td data-label="Data" className="px-4 py-3.5 text-muted">{formatDate(escala.dataEscala)}</td>
                <td data-label="Status" className="px-4 py-3.5"><StatusBadge status={escala.status} /></td>
                <td data-label="Equipe" className="px-4 py-3.5 text-muted">
                  {escala.usuarioIds.length === 0 ? "—" : escala.usuarioIds.map((id) => nomesPorId.get(id) ?? "?").join(", ")}
                </td>
                <td data-label="Ações" className="px-4 py-3.5 text-right">
                  <div className="db-row-actions">
                    <button type="button" onClick={() => setEscalaAberta(escala)} className="db-btn-sm">
                      <Pencil size={14} />
                      Editar
                    </button>
                    <form action={removerEscalaAction}>
                      <input type="hidden" name="id" value={escala.id} />
                      <button type="submit" className="text-xs font-semibold text-red-400 hover:text-red-300">Excluir</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {escalas.length === 0 && <div className="db-empty db-empty-modern">Nenhuma escala cadastrada ainda.</div>}
      </div>

      {escalaAberta && (
        <div role="presentation" className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#020817]/70 p-4 backdrop-blur-sm" onMouseDown={() => setEscalaAberta(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="escala-dialog-title" className="db-member-modal relative my-auto w-full max-w-4xl" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setEscalaAberta(null)} aria-label="Fechar formulário" className="db-icon-button absolute right-4 top-4 z-10 h-9 w-9">
              <X size={18} />
            </button>
            <div className="px-6 pt-6 sm:px-8 sm:pt-8">
              <p className="db-label text-cyan-300">Programação do ministério</p>
              <h2 id="escala-dialog-title" className="db-title mt-2 pr-10 text-3xl text-paper">{escalaAberta === "nova" ? "Nova escala" : "Editar escala"}</h2>
            </div>
            <div className="p-2 sm:p-3">
              <EscalaForm
                escala={escalaAberta === "nova" ? undefined : escalaAberta}
                usuarios={usuarios}
                musicas={musicas}
                ministerios={ministerios}
                onCancel={() => setEscalaAberta(null)}
              />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
