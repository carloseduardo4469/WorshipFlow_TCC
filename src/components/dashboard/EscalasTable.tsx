"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Escala, Usuario } from "@/types/domain";
import { StatusBadge } from "@/components/ui/StatusBadge";

function formatDate(iso: string | null) {
  if (!iso) return "Não informada";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EscalasTable({ escalas, usuarios }: { escalas: Escala[]; usuarios: Usuario[] }) {
  const [selecionada, setSelecionada] = useState<Escala | null>(null);
  const nomesPorId = new Map(usuarios.map((usuario) => [usuario.id, usuario.nome]));

  useEffect(() => {
    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelecionada(null);
    }
    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, []);

  return (
    <>
      <div className="db-card db-data-table db-responsive-table p-2 sm:p-3">
        <table className="db-table w-full text-left text-sm">
          <thead className="bg-white/[0.035] text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Escala</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Equipe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:rgba(148,163,184,0.1)]">
            {escalas.map((escala) => (
              <tr
                key={escala.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelecionada(escala)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelecionada(escala);
                  }
                }}
                className="db-responsive-row cursor-pointer transition hover:bg-cyan-300/[.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
              >
                <td data-label="Escala" className="px-4 py-3.5 font-medium text-paper">{escala.titulo}</td>
                <td data-label="Data" className="px-4 py-3.5 text-muted">{formatDate(escala.dataEscala)}</td>
                <td data-label="Status" className="px-4 py-3.5"><StatusBadge status={escala.status} /></td>
                <td data-label="Equipe" className="px-4 py-3.5 text-muted">{escala.usuarioIds.length} membro(s)</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selecionada && (
        <div role="presentation" className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#020817]/70 p-4 backdrop-blur-sm" onMouseDown={() => setSelecionada(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="escala-detalhes-titulo" className="db-member-modal relative my-auto w-full max-w-xl p-6 sm:p-8" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setSelecionada(null)} aria-label="Fechar detalhes da escala" className="db-icon-button absolute right-4 top-4 h-9 w-9">
              <X size={18} />
            </button>
            <p className="db-label text-cyan-300">Detalhes da escala</p>
            <h2 id="escala-detalhes-titulo" className="db-title mt-3 pr-10 text-3xl text-paper">{selecionada.titulo}</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="db-label">Data</dt>
                <dd className="mt-1 text-base font-semibold text-paper">{formatDate(selecionada.dataEscala)}</dd>
              </div>
              <div>
                <dt className="db-label">Status</dt>
                <dd className="mt-2"><StatusBadge status={selecionada.status} /></dd>
              </div>
              <div>
                <dt className="db-label">Equipe</dt>
                <dd className="mt-1 text-base font-semibold text-paper">
                  {selecionada.usuarioIds.length === 0
                    ? "Nenhum membro informado"
                    : selecionada.usuarioIds.map((usuarioId) => {
                        const funcao = selecionada.funcoesUsuarios.find((item) => item.usuarioId === usuarioId)?.funcao;
                        return `${nomesPorId.get(usuarioId) ?? "Membro não encontrado"}${funcao ? ` · ${funcao}` : ""}`;
                      }).join(", ")}
                </dd>
              </div>
              <div>
                <dt className="db-label">Músicas</dt>
                <dd className="mt-1 text-base font-semibold text-paper">{selecionada.musicaIds.length} música(s)</dd>
              </div>
            </div>
            {selecionada.observacoes && (
              <div className="mt-6 border-t border-white/10 pt-5">
                <dt className="db-label">Observações</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm font-medium leading-relaxed text-paper/80">{selecionada.observacoes}</dd>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
