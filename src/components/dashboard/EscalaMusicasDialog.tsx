"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { Music2, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { adicionarMusicasNaEscalaAction } from "@/lib/actions/escalas";
import { buscarMusicas, buscarMusicasPorIds } from "@/lib/actions/musicas";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { Select } from "@/components/ui/Select";
import { TONALIDADES_MAIORES, tomParaSelecao } from "@/lib/music/tonalidades";
import { FORM_LIMITS, normalizeSearch } from "@/lib/validation/forms";
import { usePaginacaoDeslizante } from "./usePaginacaoDeslizante";
import { NovaMusicaEscalaDialog } from "./NovaMusicaEscalaDialog";
import type { Escala, Musica } from "@/types/domain";

export function EscalaMusicasDialog({ escala, onClose }: { escala: Escala; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(adicionarMusicasNaEscalaAction, null);
  const [selecionadas, setSelecionadas] = useState(new Set(escala.musicaIds));
  const [nomesSelecionados, setNomesSelecionados] = useState<Musica[]>([]);
  const [tonalidades, setTonalidades] = useState<Record<number, string>>(() =>
    Object.fromEntries(escala.tonalidadesMusicas.map((item) => [item.musicaId, item.tonalidade]))
  );
  const [novaMusicaAberta, setNovaMusicaAberta] = useState(false);
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setTermo(busca.trim()), 250);
    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    if (escala.musicaIds.length === 0) return;
    buscarMusicasPorIds(escala.musicaIds).then((musicas) => {
      setNomesSelecionados(musicas);
      setTonalidades((atuais) => {
        const proximas = { ...atuais };
        musicas.forEach((musica) => {
          if (!proximas[musica.id]) proximas[musica.id] = tomParaSelecao(musica.tonalidade);
        });
        return proximas;
      });
    }).catch(() => {});
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
    const adicionando = !selecionadas.has(musica.id);
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
    if (adicionando) {
      setTonalidades((atuais) => ({
        ...atuais,
        [musica.id]: atuais[musica.id] || tomParaSelecao(musica.tonalidade),
      }));
    }
  }

  return (
    <>
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-[#020817]/70 p-2 backdrop-blur-sm sm:p-5" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="musicas-escala-titulo" className="db-member-modal relative my-auto max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto p-4 sm:p-7" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} className="db-icon-button absolute right-4 top-4 h-9 w-9" aria-label="Fechar"><X size={17} /></button>
        <p className="db-label text-cyan-300">Repertório da escala</p>
        <h2 id="musicas-escala-titulo" className="db-title mt-2 pr-12 text-2xl text-paper sm:text-3xl">Adicionar músicas</h2>
        <p className="mt-2 truncate text-sm text-muted">{escala.titulo}</p>

        <form action={formAction} className="mt-5 flex flex-col gap-4">
          <input type="hidden" name="escalaId" value={escala.id} />
          {[...selecionadas].map((id) => <input key={id} type="hidden" name="musicaIds" value={id} />)}

          {nomesSelecionados.some((musica) => selecionadas.has(musica.id)) && (
            <div className="flex flex-col gap-2">
              {nomesSelecionados.filter((musica) => selecionadas.has(musica.id)).map((musica) => (
                <div key={musica.id} className="db-scale-selected-song flex items-center gap-2 rounded-xl p-2 pl-3">
                  <span className="db-scale-song-name min-w-0 flex-1 truncate text-sm font-semibold">{musica.titulo}</span>
                  <div className="w-28 shrink-0">
                    <Select
                      name={`tonalidade_${musica.id}`}
                      value={tonalidades[musica.id] ?? ""}
                      onValueChange={(tom) => setTonalidades((atuais) => ({ ...atuais, [musica.id]: tom }))}
                      aria-label={`Tom de ${musica.titulo}`}
                      className="px-2 py-1.5 text-xs"
                      options={[
                        { value: "", label: "Escolha o tom" },
                        ...TONALIDADES_MAIORES.map((tom) => ({ value: tom, label: tom })),
                      ]}
                    />
                  </div>
                  <button type="button" onClick={() => alternar(musica)} className="db-icon-button h-8 w-8 shrink-0" aria-label={`Remover ${musica.titulo}`}><X size={13} /></button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={busca} onChange={(event) => setBusca(normalizeSearch(event.target.value))} maxLength={FORM_LIMITS.busca} placeholder="Pesquisar músicas..." className="db-input w-full !pl-10" aria-label="Pesquisar músicas" />
            </label>
            <button type="button" onClick={() => setNovaMusicaAberta(true)} className="db-btn-sm justify-center text-xs"><Plus size={14} /> Nova música</button>
          </div>

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
    {novaMusicaAberta && (
      <NovaMusicaEscalaDialog
        onClose={() => setNovaMusicaAberta(false)}
        onCreated={(musica) => {
          setSelecionadas((atuais) => new Set(atuais).add(musica.id));
          setNomesSelecionados((atuais) => [...atuais, musica]);
          setTonalidades((atuais) => ({ ...atuais, [musica.id]: tomParaSelecao(musica.tonalidade) }));
          setNovaMusicaAberta(false);
        }}
      />
    )}
    </>
  );
}
