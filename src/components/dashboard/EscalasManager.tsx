"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { removerEscalaAction } from "@/lib/actions/escalas";
import { EscalaForm } from "./EscalaForm";
import { EscalaDetailsDialog } from "./EscalaDetailsDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { useDialogA11y } from "@/components/ui/useDialogA11y";
import { normalizarEscalas } from "@/lib/escalas/normalize";
import type { Escala, Usuario } from "@/types/domain";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EscalasManager({
  escalas: escalasOriginais,
  usuariosReferenciados,
  usuariosIniciais,
  temMaisUsuariosInicial,
}: {
  escalas: Escala[];
  usuariosReferenciados: Usuario[];
  usuariosIniciais: Usuario[];
  temMaisUsuariosInicial: boolean;
}) {
  const [escalaAberta, setEscalaAberta] = useState<Escala | "nova" | null>(null);
  const [detalhe, setDetalhe] = useState<Escala | null>(null);
  const [escalaParaExcluir, setEscalaParaExcluir] = useState<Escala | null>(null);
  const formDialogRef = useDialogA11y(Boolean(escalaAberta), () => setEscalaAberta(null));
  const escalas = useMemo(() => normalizarEscalas(escalasOriginais), [escalasOriginais]);
  const nomesPorId = useMemo(
    () => new Map(usuariosReferenciados.map((usuario) => [usuario.id, usuario.nome])),
    [usuariosReferenciados]
  );

  return (
    <>
      <div className="db-page-toolbar db-schedule-toolbar">
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

      <div className="db-card db-responsive-table db-schedule-table p-3 sm:p-4">
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
              <tr key={escala.id} role="button" tabIndex={0} onClick={() => setDetalhe(escala)} onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setDetalhe(escala); } }} className="db-responsive-row db-schedule-row cursor-pointer">
                <td data-label="Título" className="px-4 py-3.5"><strong className="db-schedule-row-title">{escala.titulo}</strong></td>
                <td data-label="Data" className="px-4 py-3.5"><span className="db-schedule-cell">{formatDate(escala.dataEscala)}</span></td>
                <td data-label="Status" className="px-4 py-3.5"><StatusBadge status={escala.status} /></td>
                <td data-label="Equipe" className="px-4 py-3.5">
                  <span className="db-schedule-cell">{escala.usuarioIds.length} membro(s)</span>
                  {escala.usuarioIds.length > 0 && <span className="db-schedule-row-hint mt-1 block max-w-[20rem] truncate">{escala.usuarioIds.slice(0, 3).map((id) => nomesPorId.get(id) ?? "Membro removido").join(", ")}{escala.usuarioIds.length > 3 ? ` +${escala.usuarioIds.length - 3}` : ""}</span>}
                </td>
                <td data-label="Ações" className="px-4 py-3.5 text-right" onClick={(event) => event.stopPropagation()}>
                  <div className="db-row-actions" onClick={(event) => event.stopPropagation()}>
                    <button type="button" onClick={() => setEscalaAberta(escala)} className="db-btn-sm">
                      <Pencil size={14} />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEscalaParaExcluir(escala)}
                      className="db-danger-button text-xs font-semibold text-red-400 hover:text-red-300"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {escalas.length === 0 && <div className="db-empty db-empty-modern">Nenhuma escala cadastrada ainda.</div>}
      </div>

      {detalhe && <EscalaDetailsDialog escala={detalhe} usuarios={usuariosReferenciados} onClose={() => setDetalhe(null)} />}

      {escalaAberta && (
        <div role="presentation" className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#020817]/70 p-2 backdrop-blur-sm sm:p-4" onMouseDown={() => setEscalaAberta(null)}>
          <section ref={formDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="escala-dialog-title" className="db-member-modal relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto overscroll-contain touch-pan-y pb-4" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setEscalaAberta(null)} aria-label="Fechar formulário" className="db-icon-button absolute right-4 top-4 z-10 h-9 w-9">
              <X size={18} />
            </button>
            <div className="px-4 pt-5 sm:px-8 sm:pt-8">
              <p className="db-label text-cyan-300">Programação do ministério</p>
              <h2 id="escala-dialog-title" className="db-title mt-2 pr-10 text-3xl text-paper">{escalaAberta === "nova" ? "Nova escala" : "Editar escala"}</h2>
            </div>
            <div className="p-2 sm:p-3">
              <EscalaForm
                key={escalaAberta === "nova" ? "nova" : escalaAberta.id}
                escala={escalaAberta === "nova" ? undefined : escalaAberta}
                usuarios={escalaAberta === "nova" ? usuariosIniciais : usuariosReferenciados}
                temMaisUsuariosInicial={escalaAberta === "nova" && temMaisUsuariosInicial}
                onCancel={() => setEscalaAberta(null)}
              />
            </div>
          </section>
        </div>
      )}

      <DeleteConfirmDialog
        open={Boolean(escalaParaExcluir)}
        title="Excluir escala?"
        description={<>A escala <strong>“{escalaParaExcluir?.titulo}”</strong> será removida permanentemente.</>}
        onCancel={() => setEscalaParaExcluir(null)}
      >
        {escalaParaExcluir && (
          <form action={removerEscalaAction} onSubmit={() => setEscalaParaExcluir(null)}>
            <input type="hidden" name="id" value={escalaParaExcluir.id} />
            <button type="submit" className="delete-confirm-danger w-full">Sim, excluir</button>
          </form>
        )}
      </DeleteConfirmDialog>
    </>
  );
}
