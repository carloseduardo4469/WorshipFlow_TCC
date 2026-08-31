"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { ArrowUp, ChevronDown, ExternalLink, Pencil, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { removerMusicaAction } from "@/lib/actions/musicas";
import { MusicaForm } from "./MusicaForm";
import type { Musica } from "@/types/domain";

export function MusicasManager({ musicas, isAdmin }: { musicas: Musica[]; isAdmin: boolean }) {
  const [musicaAberta, setMusicaAberta] = useState<Musica | "nova" | null>(null);
  const [busca, setBusca] = useState("");
  const [campoFiltro, setCampoFiltro] = useState("titulo");
  const [filtroAberto, setFiltroAberto] = useState(false);
  const listaRef = useRef<HTMLDivElement>(null);
  const filtroRef = useRef<HTMLDivElement>(null);

  // Exclusão otimista: a linha sai da lista na hora, sem esperar o servidor.
  // Se a ação falhar, o React descarta o estado otimista e a linha volta.
  const [musicasOtimistas, removerOtimista] = useOptimistic(musicas, (estado, idRemover: number) =>
    estado.filter((musica) => musica.id !== idRemover),
  );
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function excluirMusica(id: number, titulo: string) {
    setErroExclusao(null);
    startTransition(async () => {
      removerOtimista(id);
      try {
        const formData = new FormData();
        formData.set("id", String(id));
        await removerMusicaAction(formData);
      } catch {
        setErroExclusao(`Não foi possível excluir "${titulo}". Tente novamente.`);
      }
    });
  }

  const filtros = [
    { value: "titulo", label: "Nome" },
    { value: "artista", label: "Artista" },
    { value: "tonalidade", label: "Tom" },
    { value: "bpm", label: "BPM" },
  ];

  useEffect(() => {
    function fecharComEscape(event: KeyboardEvent) { if (event.key === "Escape") setMusicaAberta(null); }
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

  const termo = busca.trim().toLocaleLowerCase();
  const musicasFiltradas = termo
    ? musicasOtimistas.filter((musica) => {
        const valor = campoFiltro === "artista"
          ? musica.artista
          : campoFiltro === "tonalidade"
            ? musica.tonalidade
            : campoFiltro === "bpm"
              ? musica.bpm?.toString()
              : musica.titulo;
        return valor?.toLocaleLowerCase().includes(termo);
      })
    : musicasOtimistas;
  const mostrarVoltarAoTopo = musicasFiltradas.length > 6;

  return <>
    <div className="db-music-panel db-card p-3 sm:p-4">
      <div>
        <div className="mb-4 flex flex-col gap-4 border-b border-white/[0.08] pb-4 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-2 sm:min-w-[240px]">
            <span className="db-label">Pesquisar</span>
            <span className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar música..."
                className="db-input w-full !pl-10"
                aria-label="Pesquisar músicas"
              />
            </span>
          </label>
          <div ref={filtroRef} className="relative flex flex-col gap-2 sm:w-44">
            <span className="flex items-center gap-1.5 db-label"><SlidersHorizontal size={14} className="text-cyan-300" />Filtrar por</span>
            <button type="button" onClick={() => setFiltroAberto((aberto) => !aberto)} className="db-select flex items-center justify-between text-left" aria-haspopup="listbox" aria-expanded={filtroAberto} aria-label="Campo do filtro">
              <span>{filtros.find((filtro) => filtro.value === campoFiltro)?.label}</span>
              <ChevronDown size={16} className={`transition-transform ${filtroAberto ? "rotate-180" : ""}`} />
            </button>
            {filtroAberto && <div className="db-select-menu" role="listbox" aria-label="Opções de filtro">
              {filtros.map((filtro) => <button key={filtro.value} type="button" role="option" aria-selected={campoFiltro === filtro.value} onClick={() => { setCampoFiltro(filtro.value); setFiltroAberto(false); }} className="db-select-option">{filtro.label}</button>)}
            </div>}
          </div>
          {isAdmin && <button type="button" onClick={() => setMusicaAberta("nova")} className="db-cta justify-center sm:min-h-[42px]"><Plus size={16} />Nova música</button>}
        </div>

        {erroExclusao && (
          <p role="alert" className="mb-3 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300">
            {erroExclusao}
          </p>
        )}

        <div className="relative min-w-0">
          {musicasOtimistas.length === 0 ? <div className="db-empty db-empty-modern">Nenhuma música cadastrada ainda.</div> : <div ref={listaRef} className="db-music-scroll max-h-[min(68vh,720px)] overflow-y-auto overscroll-contain rounded-xl"><table className="db-table w-full text-left text-sm md:table"><thead className="sticky top-0 z-10 hidden bg-[#0b1b30] text-xs uppercase tracking-wide text-muted md:table-header-group"><tr><th className="px-4 py-3 font-medium">Título</th><th className="px-4 py-3 font-medium">Artista</th><th className="px-4 py-3 font-medium">Tom</th><th className="px-4 py-3 font-medium">BPM</th><th className="px-4 py-3 font-medium">Cifra</th><th className="px-4 py-3 font-medium"><span className="sr-only">Ações</span></th></tr></thead><tbody className="grid gap-3 md:table-row-group md:divide-y md:divide-[color:rgba(148,163,184,0.1)]">{musicasFiltradas.map((musica) => <tr key={musica.id} className="grid grid-cols-2 gap-x-4 rounded-xl border border-white/[0.08] bg-white/[0.02] md:table-row md:rounded-none md:border-0 md:bg-transparent"><td className="col-span-2 px-4 pb-1 pt-3.5 text-paper font-medium md:table-cell md:py-3.5">{musica.linkCifra ? <a href={musica.linkCifra} target="_blank" rel="noreferrer" className="break-words hover:text-cyan-300 hover:underline">{musica.titulo}</a> : musica.titulo}</td><td className="px-4 py-1.5 text-muted md:table-cell md:py-3.5"><span className="mr-2 text-xs uppercase text-muted/70 md:hidden">Artista:</span>{musica.artista ?? "—"}</td><td className="px-4 py-1.5 font-mono text-amber md:table-cell md:py-3.5"><span className="mr-2 font-sans text-xs uppercase text-muted/70 md:hidden">Tom:</span>{musica.tonalidade ?? "—"}</td><td className="px-4 py-1.5 text-muted md:table-cell md:py-3.5"><span className="mr-2 text-xs uppercase text-muted/70 md:hidden">BPM:</span>{musica.bpm ?? "—"}</td><td className="px-4 py-1.5 text-muted md:table-cell md:py-3.5"><span className="mr-2 text-xs uppercase text-muted/70 md:hidden">Cifra:</span>{musica.linkCifra ? <a href={musica.linkCifra} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-cyan-300 hover:text-cyan-200 hover:underline"><span className="max-w-[180px] truncate">{musica.linkCifra}</span><ExternalLink size={13} /></a> : "—"}</td><td className="col-span-2 px-4 pb-3 pt-1.5 text-right md:table-cell md:py-3.5">{isAdmin && <div className="db-row-actions"><button type="button" onClick={() => setMusicaAberta(musica)} className="db-btn-sm"><Pencil size={14} />Editar</button><button type="button" onClick={() => excluirMusica(musica.id, musica.titulo)} className="text-xs font-semibold text-red-400 hover:text-red-300">Excluir</button></div>}</td></tr>)}</tbody></table>{musicasFiltradas.length === 0 && <div className="db-empty px-4 py-10">Nenhuma música encontrada.</div>}</div>}
          {mostrarVoltarAoTopo && <button type="button" onClick={() => listaRef.current?.scrollTo({ top: 0, behavior: "smooth" })} className="db-icon-button absolute bottom-3 right-3 z-20 h-10 w-10 shadow-lg" aria-label="Voltar ao topo da lista de músicas" title="Voltar ao topo"><ArrowUp size={18} /></button>}
        </div>
      </div>
    </div>

    {musicaAberta && <div role="presentation" className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#020817]/70 p-4 backdrop-blur-sm" onMouseDown={() => setMusicaAberta(null)}><section role="dialog" aria-modal="true" aria-labelledby="musica-dialog-title" className="db-member-modal my-auto relative w-full max-w-xl" onMouseDown={(event) => event.stopPropagation()}><button type="button" onClick={() => setMusicaAberta(null)} aria-label="Fechar formulário" className="db-icon-button absolute right-4 top-4 z-10 h-9 w-9"><X size={18} /></button><div className="px-6 pt-6 sm:px-8 sm:pt-8"><p className="db-label text-cyan-300">Biblioteca musical</p><h2 id="musica-dialog-title" className="db-title mt-2 pr-10 text-3xl text-paper">{musicaAberta === "nova" ? "Nova música" : "Editar música"}</h2></div><div className="p-2 sm:p-3"><MusicaForm musica={musicaAberta === "nova" ? undefined : musicaAberta} onCancel={() => setMusicaAberta(null)} /></div></section></div>}
  </>;
}
