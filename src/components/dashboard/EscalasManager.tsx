"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Pencil, Plus, X } from "lucide-react";
import { removerEscalaAction } from "@/lib/actions/escalas";
import { buscarMusicasPorIds } from "@/lib/actions/musicas";
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
  ministerios,
}: {
  escalas: Escala[];
  usuarios: Usuario[];
  ministerios: Ministerio[];
}) {
  const [escalaAberta, setEscalaAberta] = useState<Escala | "nova" | null>(null);
  const [detalhe, setDetalhe] = useState<{ escala: Escala; musicas: Musica[] } | null>(null);
  const [detalheCarregando, setDetalheCarregando] = useState(false);
  const nomesPorId = new Map(usuarios.map((usuario) => [usuario.id, usuario.nome]));
  const nomeMinisterio = (id: number | null) =>
    id == null ? null : (ministerios.find((m) => m.id === id)?.nome ?? null);

  useEffect(() => {
    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setEscalaAberta(null);
        setDetalhe(null);
      }
    }
    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, []);

  async function abrirDetalhe(escala: Escala) {
    if (escala.musicaIds.length === 0) {
      setDetalhe({ escala, musicas: [] });
      setDetalheCarregando(false);
      return;
    }
    setDetalheCarregando(true);
    setDetalhe({ escala, musicas: [] });
    try {
      const encontradas = await buscarMusicasPorIds(escala.musicaIds);
      setDetalhe((prev) => {
        if (!prev || prev.escala.id !== escala.id) return prev;
        const mapa = new Map(encontradas.map((m) => [m.id, m]));
        const ordenadas = escala.musicaIds
          .map((id) => mapa.get(id))
          .filter((m): m is Musica => Boolean(m));
        return { ...prev, musicas: ordenadas };
      });
    } catch {
      // Mantém a lista vazia; a UI mostra a mensagem de erro.
    } finally {
      setDetalheCarregando(false);
    }
  }

  function tonalidadeDaMusica(escala: Escala, musicaId: number) {
    return escala.tonalidadesMusicas.find((t) => t.musicaId === musicaId)?.tonalidade ?? null;
  }

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
              <tr key={escala.id} role="button" tabIndex={0} onClick={() => abrirDetalhe(escala)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); abrirDetalhe(escala); } }} className="db-responsive-row cursor-pointer transition hover:bg-cyan-300/[.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
                <td data-label="Título" className="px-4 py-3.5 font-medium text-paper">{escala.titulo}</td>
                <td data-label="Data" className="px-4 py-3.5 text-muted">{formatDate(escala.dataEscala)}</td>
                <td data-label="Status" className="px-4 py-3.5"><StatusBadge status={escala.status} /></td>
                <td data-label="Equipe" className="px-4 py-3.5 text-muted">
                  {escala.usuarioIds.length === 0 ? "—" : escala.usuarioIds.map((id) => nomesPorId.get(id) ?? "?").join(", ")}
                </td>
                <td data-label="Ações" className="px-4 py-3.5 text-right" onClick={(event) => event.stopPropagation()}>
                  <div className="db-row-actions" onClick={(event) => event.stopPropagation()}>
                    <button type="button" onClick={() => setEscalaAberta(escala)} className="db-btn-sm">
                      <Pencil size={14} />
                      Editar
                    </button>
                    <form action={removerEscalaAction}>
                      <input type="hidden" name="id" value={escala.id} />
                      <button type="submit" className="db-danger-button text-xs font-semibold text-red-400 hover:text-red-300">Excluir</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {escalas.length === 0 && <div className="db-empty db-empty-modern">Nenhuma escala cadastrada ainda.</div>}
      </div>

      {detalhe && (
        <div role="presentation" className="fixed inset-0 z-[70] flex items-center justify-center bg-[#020817]/70 p-3 backdrop-blur-sm sm:p-6" onMouseDown={() => setDetalhe(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="escala-detalhe-titulo" className="db-member-modal relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto overscroll-contain touch-pan-y pb-6" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setDetalhe(null)} aria-label="Fechar detalhes" className="db-icon-button absolute right-4 top-4 z-10 h-9 w-9">
              <X size={18} />
            </button>
            <div className="px-5 pt-6 sm:px-7">
              <p className="db-label text-cyan-300">Detalhes da escala</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 pr-10">
                <h2 id="escala-detalhe-titulo" className="db-title text-3xl leading-none text-paper sm:text-4xl">{detalhe.escala.titulo}</h2>
                <StatusBadge status={detalhe.escala.status} />
              </div>
            </div>

            <div className="mt-6 space-y-6 px-5 sm:px-7">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="db-label">Data</dt>
                  <dd className="mt-1 text-base font-semibold text-paper">{formatDate(detalhe.escala.dataEscala)}</dd>
                </div>
                <div>
                  <dt className="db-label">Ministério</dt>
                  <dd className="mt-1 text-base font-semibold text-paper">{nomeMinisterio(detalhe.escala.ministerioId) ?? "—"}</dd>
                </div>
              </dl>

              {detalhe.escala.observacoes && (
                <div>
                  <dt className="db-label">Observações</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-paper/80">{detalhe.escala.observacoes}</dd>
                </div>
              )}

              <div>
                <h3 className="db-label">Equipe escalada</h3>
                {detalhe.escala.usuarioIds.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">Nenhum membro escalado.</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {detalhe.escala.usuarioIds.map((id) => {
                      const funcao = detalhe.escala.funcoesUsuarios.find((f) => f.usuarioId === id)?.funcao ?? "";
                      return (
                        <li key={id} className="inline-flex max-w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-paper/90">
                          <span className="min-w-0 break-words">{nomesPorId.get(id) ?? "?"}</span>
                          {funcao && <span className="shrink-0 text-xs text-muted">{funcao}</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="db-label">Músicas</h3>
                {detalheCarregando && detalhe.musicas.length === 0 ? (
                  <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                    <Loader2 size={14} className="animate-spin" />
                    Carregando músicas...
                  </p>
                ) : detalhe.escala.musicaIds.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">Nenhuma música nessa escala.</p>
                ) : detalhe.musicas.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">Não foi possível carregar as músicas.</p>
                ) : (
                  <div className="db-responsive-table mt-2 overflow-hidden rounded-xl border border-white/[0.08]">
                    <table className="db-table w-full text-left text-sm">
                      <thead className="bg-white/[0.035] text-xs uppercase tracking-wide text-muted">
                        <tr>
                          <th className="px-3 py-2.5 font-medium">#</th>
                          <th className="px-3 py-2.5 font-medium">Música</th>
                          <th className="px-3 py-2.5 font-medium">Tom</th>
                          <th className="px-3 py-2.5 font-medium">Cifra</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[color:rgba(148,163,184,0.1)]">
                        {detalhe.musicas.map((musica, index) => {
                          const tom = tonalidadeDaMusica(detalhe.escala, musica.id) ?? musica.tonalidade ?? "—";
                          return (
                            <tr key={musica.id} className="db-responsive-row">
                              <td data-label="#" className="px-3 py-3 font-mono text-muted">{index + 1}</td>
                              <td data-label="Música" className="px-3 py-3">
                                <span className="font-medium text-paper">{musica.titulo}</span>
                                {musica.artista && <span className="block text-xs text-muted">{musica.artista}</span>}
                              </td>
                              <td data-label="Tom" className="px-3 py-3 font-mono text-amber">{tom}</td>
                              <td data-label="Cifra" className="px-3 py-3 text-right">
                                {musica.linkCifra ? (
                                  <a href={musica.linkCifra} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 hover:underline">
                                    Abrir cifra <ExternalLink size={13} />
                                  </a>
                                ) : <span className="text-muted">—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {escalaAberta && (
        <div role="presentation" className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#020817]/70 p-4 backdrop-blur-sm" onMouseDown={() => setEscalaAberta(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="escala-dialog-title" className="db-member-modal relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto overscroll-contain touch-pan-y pb-4" onMouseDown={(event) => event.stopPropagation()}>
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
