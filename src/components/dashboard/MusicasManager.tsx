"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronDown, ExternalLink, Pencil, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { buscarMusicas, removerMusicaAction } from "@/lib/actions/musicas";
import { MusicaForm } from "./MusicaForm";
import { usePaginacaoDeslizante } from "./usePaginacaoDeslizante";
import type { Musica } from "@/types/domain";
import { FORM_LIMITS, normalizeSearch } from "@/lib/validation/forms";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";

type CampoFiltro = "titulo" | "artista" | "tonalidade";

const FILTROS: { value: CampoFiltro; label: string }[] = [
  { value: "titulo", label: "Nome" },
  { value: "artista", label: "Artista" },
  { value: "tonalidade", label: "Tom" },
];

export function MusicasManager({ isAdmin }: { isAdmin: boolean }) {
  const [musicaAberta, setMusicaAberta] = useState<Musica | "nova" | null>(null);
  const [musicaParaExcluir, setMusicaParaExcluir] = useState<Musica | null>(null);
  const [busca, setBusca] = useState("");
  const [buscaEfetiva, setBuscaEfetiva] = useState("");
  const [campoFiltro, setCampoFiltro] = useState<CampoFiltro>("titulo");
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const filtroRef = useRef<HTMLDivElement>(null);
  const exclusoesRef = useRef(new Map<number, { item: Musica; indiceOriginal: number }>());

  // Busca com debounce: só consulta o banco quando o usuário para de digitar.
  useEffect(() => {
    const timer = setTimeout(() => setBuscaEfetiva(busca.trim()), 250);
    return () => clearTimeout(timer);
  }, [busca]);

  const buscaPorPagina = useCallback(
    (offset: number, limite: number) =>
      buscarMusicas({ busca: buscaEfetiva, campo: campoFiltro, offset, limit: limite }),
    [buscaEfetiva, campoFiltro]
  );

  const {
    containerRef: listaRef,
    sentinelaRef,
    itensVisiveis,
    topoAltura,
    fundoAltura,
    carregando,
    carregandoMais,
    temMais,
    erro,
    totalCarregado,
    roleiDaLista,
    refLinha,
    voltarAoTopo,
    removerItem,
    restaurarItem,
  } = usePaginacaoDeslizante<Musica>({
    chaveDeItem: (musica) => musica.id,
    buscaPorPagina,
    tamanhoPagina: 25,
    limiteDom: 50,
    alturaPadraoLinha: 42,
    reiniciarAo: `${campoFiltro}|${buscaEfetiva}`,
  });

  useEffect(() => {
    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMusicaAberta(null);
    }
    window.addEventListener("keydown", fecharComEscape);
    function fecharFiltroFora(event: MouseEvent) {
      if (filtroRef.current && !filtroRef.current.contains(event.target as Node)) setFiltroAberto(false);
    }
    document.addEventListener("mousedown", fecharFiltroFora);
    return () => {
      window.removeEventListener("keydown", fecharComEscape);
      document.removeEventListener("mousedown", fecharFiltroFora);
    };
  }, []);

  function excluirMusica(id: number, titulo: string) {
    setErroExclusao(null);
    const item = itensVisiveis.find((musica) => musica.id === id);
    if (!item) return;
    const indiceOriginal = removerItem(item); // otimista: some da lista na hora
    if (indiceOriginal === -1) return;
    exclusoesRef.current.set(id, { item, indiceOriginal });

    void (async () => {
      try {
        const formData = new FormData();
        formData.set("id", String(id));
        await removerMusicaAction(formData);
        exclusoesRef.current.delete(id);
      } catch {
        const pendente = exclusoesRef.current.get(id);
        exclusoesRef.current.delete(id);
        if (pendente) restaurarItem(pendente.item, pendente.indiceOriginal);
        setErroExclusao(`Não foi possível excluir "${titulo}". Tente novamente.`);
      }
    })();
  }

  return (
    <>
      <div className="db-music-panel db-card p-3 sm:p-4">
        <div>
          <div className="mb-4 flex flex-col gap-4 border-b border-white/[0.08] pb-4 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-2 sm:min-w-[240px]">
              <span className="db-label">Pesquisar</span>
              <span className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={busca}
                  onChange={(event) => setBusca(normalizeSearch(event.target.value))}
                  maxLength={FORM_LIMITS.busca}
                  placeholder="Buscar música..."
                  className="db-input w-full !pl-10"
                  aria-label="Pesquisar músicas"
                />
              </span>
            </label>
            <div ref={filtroRef} className="relative flex flex-col gap-2 sm:w-44">
              <span className="flex items-center gap-1.5 db-label"><SlidersHorizontal size={14} className="text-cyan-300" />Filtrar por</span>
              <button type="button" onClick={() => setFiltroAberto((aberto) => !aberto)} className="db-select flex items-center justify-between text-left" aria-haspopup="listbox" aria-expanded={filtroAberto} aria-label="Campo do filtro">
                <span>{FILTROS.find((filtro) => filtro.value === campoFiltro)?.label}</span>
                <ChevronDown size={16} className={`transition-transform ${filtroAberto ? "rotate-180" : ""}`} />
              </button>
              {filtroAberto && (
                <div className="db-select-menu" role="listbox" aria-label="Opções de filtro">
                  {FILTROS.map((filtro) => (
                    <button
                      key={filtro.value}
                      type="button"
                      role="option"
                      aria-selected={campoFiltro === filtro.value}
                      onClick={() => {
                        setCampoFiltro(filtro.value);
                        setFiltroAberto(false);
                      }}
                      className="db-select-option"
                    >
                      {filtro.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => setMusicaAberta("nova")} className="db-cta justify-center sm:min-h-[42px]"><Plus size={16} />Nova música</button>
          </div>

          {erroExclusao && (
            <p role="alert" className="mb-3 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300">
              {erroExclusao}
            </p>
          )}

          <div className="relative min-w-0">
            {totalCarregado === 0 && !carregando && !erro ? (
              <div className="db-empty db-empty-modern">{buscaEfetiva ? "Nenhuma música encontrada." : "Nenhuma música cadastrada ainda."}</div>
            ) : (
              <div ref={listaRef} className="db-music-scroll max-h-[min(68vh,720px)] overflow-y-auto overscroll-contain rounded-xl">
<table className="db-table w-full text-left text-sm md:table">
                  <thead className="sticky top-0 z-10 hidden bg-[#0b1b30] text-xs uppercase tracking-wide text-muted md:table-header-group">
                    <tr>
                      <th className="px-4 py-3 font-medium">Título</th>
                      <th className="px-4 py-3 font-medium">Artista</th>
                      <th className="px-4 py-3 font-medium">Tom</th>
                      <th className="px-4 py-3 font-medium">Cifra</th>
                      <th className="px-4 py-3 font-medium"><span className="sr-only">Ações</span></th>
                    </tr>
                  </thead>
                  <tbody className="grid gap-3 md:table-row-group md:divide-y md:divide-[color:rgba(148,163,184,0.1)]">
                    {topoAltura > 0 && (
                      <tr aria-hidden="true" style={{ height: topoAltura }}>
                        <td colSpan={5} className="p-0" />
                      </tr>
                    )}
                    {itensVisiveis.map((musica) => (
                      <tr
                        key={musica.id}
                        ref={refLinha(musica)}
                        className="grid grid-cols-2 gap-x-4 rounded-xl border border-white/[0.08] bg-white/[0.02] md:table-row md:rounded-none md:border-0 md:bg-transparent"
                      >
                        <td className="col-span-2 px-4 pb-1 pt-3.5 text-paper font-medium md:table-cell md:py-3.5">
                          {musica.linkCifra ? (
                            <a href={musica.linkCifra} target="_blank" rel="noreferrer" className="break-words hover:text-cyan-300 hover:underline">{musica.titulo}</a>
                          ) : (
                            musica.titulo
                          )}
                        </td>
                        <td className="px-4 py-1.5 text-muted md:table-cell md:py-3.5">
                          <span className="mr-2 text-xs uppercase text-muted/70 md:hidden">Artista:</span>
                          {musica.artista ?? "—"}
                        </td>
                        <td className="px-4 py-1.5 font-mono text-amber md:table-cell md:py-3.5">
                          <span className="mr-2 font-sans text-xs uppercase text-muted/70 md:hidden">Tom:</span>
                          {musica.tonalidade ?? "—"}
                        </td>
                        <td className="px-4 py-1.5 text-muted md:table-cell md:py-3.5">
                          <span className="mb-1 block text-xs uppercase text-muted/70 md:hidden">Cifra:</span>
                          {musica.linkCifra ? (
                            <a href={musica.linkCifra} target="_blank" rel="noreferrer" className="flex min-w-0 max-w-full items-start gap-1 text-cyan-300 hover:text-cyan-200 hover:underline">
                              <span className="min-w-0 [overflow-wrap:anywhere]">{musica.linkCifra}</span>
                              <ExternalLink size={13} className="mt-0.5 shrink-0" />
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="col-span-2 px-4 pb-3 pt-1.5 text-right md:table-cell md:py-3.5">
                          <div className="db-row-actions">
                            <button type="button" onClick={() => setMusicaAberta(musica)} className="db-btn-sm"><Pencil size={14} />Editar</button>
                            {isAdmin && (
                              <button type="button" onClick={() => setMusicaParaExcluir(musica)} className="db-danger-button text-xs font-semibold text-red-400 hover:text-red-300">
                                Excluir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
{fundoAltura > 0 && (
                      <tr aria-hidden="true" style={{ height: fundoAltura }}>
                        <td colSpan={5} className="p-0" />
                      </tr>
                    )}
                    <tr ref={sentinelaRef} aria-hidden="true">
                      <td colSpan={5} className="h-px p-0" />
                    </tr>
                  </tbody>
                </table>
                {carregando && totalCarregado === 0 && <div className="py-10 text-center text-sm text-muted">Carregando músicas...</div>}
                {erro && <p className="p-4 text-sm text-red-400">Não foi possível carregar as músicas. Tente novamente.</p>}
                {totalCarregado > 0 && itensVisiveis.length === 0 && !carregando && !erro && (
                  <div className="db-empty px-4 py-10">Nenhuma música encontrada.</div>
                )}
                {carregandoMais && <p className="py-2 text-center text-xs text-muted">Carregando mais...</p>}
                {!carregandoMais && !temMais && totalCarregado > 0 && (
                  <p className="py-2 text-center text-xs text-muted">Todas as músicas foram carregadas.</p>
                )}
              </div>
            )}
            {roleiDaLista && (
              <button
                type="button"
                onClick={voltarAoTopo}
                className="db-icon-button absolute bottom-3 right-3 z-20 h-10 w-10 shadow-lg"
                aria-label="Voltar ao topo da lista de músicas"
                title="Voltar ao topo"
              >
                <ArrowUp size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {musicaAberta && (
        <div
          role="presentation"
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#020817]/70 p-4 backdrop-blur-sm"
          onMouseDown={() => setMusicaAberta(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="musica-dialog-title"
            className="db-member-modal my-auto relative w-full max-w-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" onClick={() => setMusicaAberta(null)} aria-label="Fechar formulário" className="db-icon-button absolute right-4 top-4 z-10 h-9 w-9">
              <X size={18} />
            </button>
            <div className="px-6 pt-6 sm:px-8 sm:pt-8">
              <p className="db-label text-cyan-300">Biblioteca musical</p>
              <h2 id="musica-dialog-title" className="db-title mt-2 pr-10 text-3xl text-paper">
                {musicaAberta === "nova" ? "Nova música" : "Editar música"}
              </h2>
            </div>
            <div className="p-2 sm:p-3">
              <MusicaForm musica={musicaAberta === "nova" ? undefined : musicaAberta} onCancel={() => setMusicaAberta(null)} />
            </div>
          </section>
        </div>
      )}

      <DeleteConfirmDialog
        open={Boolean(musicaParaExcluir)}
        title="Excluir música?"
        description={<>A música <strong>“{musicaParaExcluir?.titulo}”</strong> será removida da biblioteca permanentemente.</>}
        onCancel={() => setMusicaParaExcluir(null)}
      >
        <button
          type="button"
          className="delete-confirm-danger"
          onClick={() => {
            if (musicaParaExcluir) excluirMusica(musicaParaExcluir.id, musicaParaExcluir.titulo);
            setMusicaParaExcluir(null);
          }}
        >
          Sim, excluir
        </button>
      </DeleteConfirmDialog>
    </>
  );
}
