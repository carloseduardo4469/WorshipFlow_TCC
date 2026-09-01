"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, Music2, Plus, Users } from "lucide-react";
import { normalizarEscalas } from "@/lib/escalas/normalize";
import { EscalaDetailsDialog } from "./EscalaDetailsDialog";
import { EscalaMusicasDialog } from "./EscalaMusicasDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Escala, Usuario } from "@/types/domain";

function formatarData(iso: string | null) {
  if (!iso) return "Não informada";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function EscalasTable({
  escalas: escalasOriginais,
  usuarios,
  currentUserId,
}: {
  escalas: Escala[];
  usuarios: Usuario[];
  currentUserId: string;
}) {
  const [selecionada, setSelecionada] = useState<Escala | null>(null);
  const [escalaParaMusicas, setEscalaParaMusicas] = useState<Escala | null>(null);
  const escalas = useMemo(() => normalizarEscalas(escalasOriginais), [escalasOriginais]);
  const nomesPorId = useMemo(() => new Map(usuarios.map((usuario) => [usuario.id, usuario.nome])), [usuarios]);

  return (
    <>
      <div className="db-card db-data-table db-responsive-table db-schedule-table p-2 sm:p-3">
        <table className="db-table w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 font-medium">Escala</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Equipe</th>
              <th className="px-4 py-3 font-medium">Músicas</th>
            </tr>
          </thead>
          <tbody>
            {escalas.map((escala) => {
              const nomes = escala.usuarioIds.map((id) => nomesPorId.get(id)).filter((nome): nome is string => Boolean(nome));
              const podeAdicionarMusicas = escala.funcoesUsuarios.some(
                ({ usuarioId, funcao }) => usuarioId === currentUserId && funcao.split(",").includes("voz-principal")
              );
              return (
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
                  className="db-responsive-row db-schedule-row cursor-pointer"
                >
                  <td data-label="Escala" className="px-4 py-3.5">
                    <strong className="db-schedule-row-title block">{escala.titulo}</strong>
                    <span className="db-expand-hint mt-2"><ArrowUpRight size={13} /> Clique para ver equipe e repertório</span>
                    {podeAdicionarMusicas && (
                      <button type="button" onClick={(event) => { event.stopPropagation(); setEscalaParaMusicas(escala); }} className="db-btn-sm mt-3 text-xs">
                        <Plus size={14} /> Adicionar músicas
                      </button>
                    )}
                  </td>
                  <td data-label="Data" className="px-4 py-3.5">
                    <span className="db-schedule-cell"><CalendarDays size={15} /> {formatarData(escala.dataEscala)}</span>
                  </td>
                  <td data-label="Status" className="px-4 py-3.5"><StatusBadge status={escala.status} /></td>
                  <td data-label="Equipe" className="px-4 py-3.5">
                    <span className="db-schedule-cell"><Users size={15} /> {nomes.length || escala.usuarioIds.length} membro(s)</span>
                    {nomes.length > 0 && <span className="db-schedule-row-hint mt-1 block max-w-[22rem] truncate">{nomes.slice(0, 3).join(", ")}{nomes.length > 3 ? ` +${nomes.length - 3}` : ""}</span>}
                  </td>
                  <td data-label="Músicas" className="px-4 py-3.5">
                    <span className="db-schedule-cell"><Music2 size={15} /> {escala.musicaIds.length}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selecionada && (
        <EscalaDetailsDialog
          escala={selecionada}
          usuarios={usuarios}
          onClose={() => setSelecionada(null)}
          onAddMusicas={selecionada.funcoesUsuarios.some(
            ({ usuarioId, funcao }) => usuarioId === currentUserId && funcao.split(",").includes("voz-principal")
          ) ? () => { setSelecionada(null); setEscalaParaMusicas(selecionada); } : undefined}
        />
      )}

      {escalaParaMusicas && <EscalaMusicasDialog escala={escalaParaMusicas} onClose={() => setEscalaParaMusicas(null)} />}
    </>
  );
}
