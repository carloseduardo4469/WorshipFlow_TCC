"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { Music2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { adicionarMusicasNaEscalaAction } from "@/lib/actions/escalas";
import { buscarMusicas, buscarMusicasPorIds } from "@/lib/actions/musicas";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { FORM_LIMITS, normalizeSearch } from "@/lib/validation/forms";
import { usePaginacaoDeslizante } from "./usePaginacaoDeslizante";
import type { Escala, Musica } from "@/types/domain";

export function EscalaMusicasDialog({ escala, onClose }: { escala: Escala; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(adicionarMusicasNaEscalaAction, null);
  const [selecionadas, setSelecionadas] = useState(new Set(escala.musicaIds));
  const [nomesSelecionados, setNomesSelecionados] = useState<Musica[]>([]);
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setTermo(busca.trim()), 250);
    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    if (escala.musicaIds.length === 0) return;
    buscarMusicasPorIds(escala.musicaIds).then(setNomesSelecionados).catch(() => {});
  }, [escala.musicaIds]);

  useEffect(() => {
    if (!state?.success) return;
    router.refresh();
    onClose();
  }, [state, router, onClose]);

  const buscarPagina = useCallback(
    (offset: number, limit: number) => buscarMusicas({ busca: termo, offset, limit }),
    [termo]
  );
  const {
    containerRef,
    sentinelaRef,
    itensVisiveis,
    topoAltura,
    fundoAltura,
    carregando,
    carregandoMais,
    temMais,
    erro,
    totalCarregado,
    refLinha,
  } = usePaginacaoDeslizante<Musica>({
    chaveDeItem: (musica) => musica.id,
    buscaPorPagina: buscarPagina,
    tamanhoPagina: 12,
    limiteDom: 36,
    alturaPadraoLinha: 38,
    reiniciarAo: termo,
  });

  function alternar(musica: Musica) {
    setSelecionadas((atuais) => {
      const proximas = new Set(atuais);
      if (proximas.has(musica.id)) proximas.delete(musica.id);
      else proximas.add(musica.id);
      return proximas;
    });
    setNomesSelecionados((atuais) => {
      if (atuais.some((item) => item.id === musica.id)) return atuais.filter((item) => item.id !== musica.id);
      return [...atuais, musica];
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-[#020817]/70 p-2 backdrop-blur-sm sm:p-5" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="musicas-escala-titulo" className="db-member-modal relative my-auto max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto p-4 sm:p-7" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} className="db-icon-button absolute right-4 top-4 h-9 w-9" aria-label="Fechar"><X size={17} /></button>
        <p className="db-label text-cyan-300">Repertório da escala</p>
        <h2 id="musicas-escala-titulo" className="db-title mt-2 pr-12 text-2xl text-paper sm:text-3xl">Adicionar músicas</h2>
        <p className="mt-2 truncate text-sm text-muted">{escala.titulo}</p>

        <form action={formAction} className="mt-5 flex flex-col gap-4">
          <input type="hidden" name="escalaId" value={escala.id} />
          {[...selecionadas].map((id) => <input key={id} type="hidden" name="musicaIds" value={id} />)}

          {nomesSelecionados.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {nomesSelecionados.filter((musica) => selecionadas.has(musica.id)).map((musica) => (
                <button key={musica.id} type="button" onClick={() => alternar(musica)} className="db-scale-selected-song db-scale-song-name flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs">
                  <span className="max-w-48 truncate">{musica.titulo}</span><X size={13} />
                </button>
              ))}
            </div>
          )}

          <label className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={busca} onChange={(event) => setBusca(normalizeSearch(event.target.value))} maxLength={FORM_LIMITS.busca} placeholder="Pesquisar músicas..." className="db-input w-full !pl-10" aria-label="Pesquisar músicas" />
          </label>

          <div ref={containerRef} className="db-card db-music-scroll db-scale-picker db-scale-music-list overflow-y-scroll p-3">
            {carregando && totalCarregado === 0 ? <p className="text-sm text-muted">Carregando músicas...</p>
              : erro ? <p className="text-sm text-red-400">Não foi possível carregar as músicas.</p>
              : totalCarregado === 0 ? <p className="text-sm text-muted">Nenhuma música encontrada.</p>
              : <>
                {topoAltura > 0 && <div aria-hidden="true" style={{ height: topoAltura }} />}
                {itensVisiveis.map((musica) => (
                  <label key={musica.id} ref={refLinha(musica)} className="db-scale-option flex cursor-pointer items-start gap-2 py-2 text-sm text-paper/80">
                    <input type="checkbox" checked={selecionadas.has(musica.id)} onChange={() => alternar(musica)} className="db-checkbox mt-0.5 h-4 w-4" />
                    <span className="min-w-0"><strong className="block break-words">{musica.titulo}</strong>{musica.artista && <small className="text-muted">{musica.artista}</small>}</span>
                  </label>
                ))}
                {fundoAltura > 0 && <div aria-hidden="true" style={{ height: fundoAltura }} />}
                <div ref={sentinelaRef} className="h-px" aria-hidden="true" />
                {carregandoMais && <p className="py-2 text-center text-xs text-muted">Carregando mais...</p>}
                {!carregandoMais && temMais && <p className="py-2 text-center text-xs text-muted">Role para carregar mais</p>}
              </>}
          </div>

          {state?.error && <FormAlert>{state.error}</FormAlert>}
          <div className="db-form-actions">
            <Button type="submit" disabled={pending}><Music2 size={16} /> {pending ? "Salvando..." : "Salvar músicas"}</Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
