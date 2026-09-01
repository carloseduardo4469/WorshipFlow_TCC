"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { criarRepertorioAction, atualizarRepertorioAction } from "@/lib/actions/repertorios";
import { buscarMusicas, buscarMusicasPorIds } from "@/lib/actions/musicas";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { usePaginacaoDeslizante } from "./usePaginacaoDeslizante";
import type { Musica, Repertorio } from "@/types/domain";
import { FORM_LIMITS, normalizeSearch } from "@/lib/validation/forms";

export function RepertorioForm({
  repertorio,
}: {
  repertorio?: Repertorio;
}) {
  const action = repertorio ? atualizarRepertorioAction : criarRepertorioAction;
  const [state, formAction, pending] = useActionState(action, null);
  const router = useRouter();

  const [musicaIds, setMusicaIds] = useState<Set<number>>(new Set(repertorio?.musicaIds ?? []));
  const [musicasSelecionadas, setMusicasSelecionadas] = useState<Musica[]>([]);
  const [musicaBusca, setMusicaBusca] = useState("");
  const [musicaTermo, setMusicaTermo] = useState("");

  // Busca com debounce: só consulta o banco quando o usuário para de digitar.
  useEffect(() => {
    const timer = setTimeout(() => setMusicaTermo(musicaBusca.trim()), 250);
    return () => clearTimeout(timer);
  }, [musicaBusca]);

  // Músicas já vinculadas ao repertório aparecem como chips fora da busca.
  useEffect(() => {
    const ids = repertorio?.musicaIds ?? [];
    if (ids.length === 0) return;
    let ativo = true;
    buscarMusicasPorIds(ids)
      .then((resultado) => {
        if (!ativo) return;
        setMusicasSelecionadas((prev) => {
          const vistos = new Set(prev.map((m) => m.id));
          return [...prev, ...resultado.filter((m) => !vistos.has(m.id))];
        });
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [repertorio]);

  const buscaMusicasPaginada = useCallback(
    (offset: number, limite: number) => buscarMusicas({ busca: musicaTermo, offset, limit: limite }),
    [musicaTermo]
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
    erro: erroCarregar,
    totalCarregado,
    refLinha,
  } = usePaginacaoDeslizante<Musica>({
    chaveDeItem: (musica) => musica.id,
    buscaPorPagina: buscaMusicasPaginada,
    tamanhoPagina: 20,
    limiteDom: 60,
    alturaPadraoLinha: 28,
    reiniciarAo: musicaTermo,
  });

  function toggleMusica(musica: Musica) {
    setMusicaIds((prev) => {
      const next = new Set(prev);
      if (next.has(musica.id)) {
        next.delete(musica.id);
        setMusicasSelecionadas((prevSel) => prevSel.filter((m) => m.id !== musica.id));
      } else {
        next.add(musica.id);
        setMusicasSelecionadas((prevSel) =>
          prevSel.some((m) => m.id === musica.id) ? prevSel : [...prevSel, musica]
        );
      }
      return next;
    });
  }
return (
    <form action={formAction} className="db-panel flex max-w-lg flex-col gap-5 p-6 text-left sm:p-8">
      {repertorio && <input type="hidden" name="id" value={repertorio.id} />}

      <Input label="Nome" name="nome" defaultValue={repertorio?.nome} maxLength={FORM_LIMITS.nomeGenerico} required />
      <Input label="Descrição" name="descricao" defaultValue={repertorio?.descricao ?? ""} maxLength={FORM_LIMITS.descricao} />

      <fieldset className="flex flex-col gap-2">
        <legend className="db-label mb-1">Músicas</legend>

        {[...musicaIds].map((id) => (
          <input key={id} type="hidden" name="musicaIds" value={id} />
        ))}

        {musicasSelecionadas.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="db-label text-xs text-cyan-300">
              Selecionadas ({musicasSelecionadas.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {musicasSelecionadas.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/25 bg-cyan-300/5 px-2.5 py-1 text-xs text-paper/90"
                >
                  <span className="min-w-0">
                    {m.titulo}
                    {m.artista && <span className="text-muted"> — {m.artista}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleMusica(m)}
                    aria-label={`Remover ${m.titulo}`}
                    title="Remover"
                    className="text-muted hover:text-red-400"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <label className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={musicaBusca}
            onChange={(event) => setMusicaBusca(normalizeSearch(event.target.value))}
            maxLength={FORM_LIMITS.busca}
            placeholder="Pesquisar músicas..."
            className="db-input w-full !pl-10"
            aria-label="Pesquisar músicas para o repertório"
          />
        </label>

        <div ref={listaRef} className="db-card max-h-64 overflow-y-auto p-3">
          {carregando && totalCarregado === 0 ? (
            <p className="text-sm text-muted">Carregando músicas...</p>
          ) : erroCarregar ? (
            <p className="text-sm text-red-400">Não foi possível carregar as músicas. Tente novamente.</p>
          ) : totalCarregado === 0 ? (
            <p className="text-sm text-muted">Nenhuma música cadastrada.</p>
          ) : (
            <>
              {topoAltura > 0 && <div aria-hidden="true" style={{ height: topoAltura }} />}
              {itensVisiveis.map((m) => {
                const checked = musicaIds.has(m.id);
                return (
                  <label
                    key={m.id}
                    ref={refLinha(m)}
                    className={`flex min-w-0 cursor-pointer items-start gap-2 break-words py-1 text-sm ${checked ? "text-cyan-300" : "text-paper/80"}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMusica(m)}
                      className="h-4 w-4 db-checkbox"
                    />
                    {m.titulo}
                    {m.artista && <span className="text-muted"> — {m.artista}</span>}
                  </label>
                );
              })}
              {fundoAltura > 0 && <div aria-hidden="true" style={{ height: fundoAltura }} />}
              <div ref={sentinelaRef} className="h-px" aria-hidden="true" />
              {carregandoMais && <p className="py-2 text-center text-xs text-muted">Carregando mais...</p>}
              {!carregandoMais && !temMais && (
                <p className="py-2 text-center text-xs text-muted">Todas as músicas foram carregadas.</p>
              )}
            </>
          )}
        </div>
      </fieldset>

      {state?.error && <FormAlert>{state.error}</FormAlert>}

      <div className="mt-2 flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
