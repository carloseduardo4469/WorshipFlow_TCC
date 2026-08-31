"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { criarEscalaAction, atualizarEscalaAction } from "@/lib/actions/escalas";
import { buscarMusicas, buscarMusicasPorIds } from "@/lib/actions/musicas";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { TONALIDADES_MAIORES, tomParaSelecao } from "@/lib/music/tonalidades";
import { usePaginacaoDeslizante } from "./usePaginacaoDeslizante";
import type { Escala, Ministerio, Musica, StatusEscala, Usuario } from "@/types/domain";

const STATUS_OPTIONS: { value: StatusEscala; label: string }[] = [
  { value: "PUBLICADA", label: "Publicada" },
  { value: "CONCLUIDA", label: "Concluída" },
];

const NOMES_FUNCOES: Record<string, string> = {
  violao: "Violão",
  guitarra: "Guitarra",
  bateria: "Bateria",
  teclado: "Teclado",
  baixo: "Baixo",
  "voz-principal": "Voz principal",
  "voz-secundaria": "Voz secundária",
};

export function EscalaForm({
  escala,
  usuarios,
  ministerios,
  onCancel,
}: {
  escala?: Escala;
  usuarios: Usuario[];
  ministerios: Ministerio[];
  onCancel?: () => void;
}) {
  const action = escala ? atualizarEscalaAction : criarEscalaAction;
  const [state, formAction, pending] = useActionState(action, null);
  const router = useRouter();

  const [usuarioIds, setUsuarioIds] = useState<Set<string>>(new Set(escala?.usuarioIds ?? []));
  const [musicaIds, setMusicaIds] = useState<Set<number>>(new Set(escala?.musicaIds ?? []));
  const [musicasSelecionadas, setMusicasSelecionadas] = useState<Musica[]>([]);
  const [musicaBusca, setMusicaBusca] = useState("");
  const [musicaTermo, setMusicaTermo] = useState("");

  // Busca com debounce: só consulta o banco quando o usuário para de digitar.
  useEffect(() => {
    const timer = setTimeout(() => setMusicaTermo(musicaBusca.trim()), 250);
    return () => clearTimeout(timer);
  }, [musicaBusca]);

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

  const hoje = new Date();
  const dataMinima = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

  const funcaoAtual = (usuarioId: string) =>
    escala?.funcoesUsuarios.find((f) => f.usuarioId === usuarioId)?.funcao ?? "";
  const tonalidadeAtual = (musicaId: number) =>
    escala?.tonalidadesMusicas.find((t) => t.musicaId === musicaId)?.tonalidade ?? "";

  // Músicas já vinculadas à escala aparecem como chips fora da busca, para não
  // ocuparem o espaço dos resultados da pesquisa.
  useEffect(() => {
    const ids = escala?.musicaIds ?? [];
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
  }, [escala]);

  function toggleUsuario(id: string) {
    setUsuarioIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

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
    <form action={formAction} className="db-panel flex max-w-2xl flex-col gap-6 p-6 text-left sm:p-8">
      {escala && <input type="hidden" name="id" value={escala.id} />}

      <div className="flex flex-col gap-4">
        <Input label="Título" name="titulo" defaultValue={escala?.titulo} required />

        <div className="flex flex-col gap-4 sm:flex-row">
          <Input
            label="Data"
            name="dataEscala"
            type="date"
            min={dataMinima}
            defaultValue={escala?.dataEscala ?? ""}
            className="db-date-input w-full sm:w-48"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="db-label">
              Estado
            </label>
            <Select
              id="status"
              name="status"
              defaultValue={escala?.status ?? "PUBLICADA"}
              aria-label="Estado"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="ministerioId" className="db-label">
              Ministério
            </label>
            <Select
              id="ministerioId"
              name="ministerioId"
              defaultValue={escala?.ministerioId ?? ""}
              aria-label="Ministério"
              options={[
                { value: "", label: "Nenhum" },
                ...ministerios.map((ministerio) => ({
                  value: String(ministerio.id),
                  label: ministerio.nome,
                })),
              ]}
            />
          </div>
        </div>

        <Input label="Observações" name="observacoes" defaultValue={escala?.observacoes ?? ""} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="db-label mb-1">Equipe escalada</legend>
        <div className="db-card max-h-72 space-y-1 overflow-y-auto p-3">
          {usuarios.length === 0 && <p className="text-sm text-muted">Nenhum membro cadastrado.</p>}
          {usuarios.map((u) => {
            const checked = usuarioIds.has(u.id);
            const funcoes = (u.habilidades ?? "")
              .split(",")
              .map((funcao) => funcao.trim())
              .filter(Boolean);
            const funcoesSelecionadas = new Set(funcaoAtual(u.id).split(",").map((funcao) => funcao.trim()).filter(Boolean));
            return (
              <div key={u.id} className="flex flex-col gap-2 py-1.5 sm:flex-row sm:items-start sm:gap-3">
                <label className="flex flex-1 items-center gap-2 text-sm text-paper/80">
                  <input
                    type="checkbox"
                    name="usuarioIds"
                    value={u.id}
                    checked={checked}
                    onChange={() => toggleUsuario(u.id)}
                    className="h-4 w-4 db-checkbox"
                  />
                  {u.nome}
                </label>
                {checked && (
                  <div className="db-function-options flex flex-wrap gap-x-3 gap-y-1.5 sm:w-48">
                    {funcoes.length > 0 ? funcoes.map((funcao) => (
                      <label key={funcao} className="flex items-center gap-1.5 text-xs text-paper/80">
                        <input type="checkbox" name={`funcao_${u.id}`} value={funcao} defaultChecked={funcoesSelecionadas.has(funcao)} className="h-3.5 w-3.5 db-checkbox" />
                        {NOMES_FUNCOES[funcao] ?? funcao}
                      </label>
                    )) : <span className="text-xs text-muted">Nenhuma função cadastrada.</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

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
              {musicasSelecionadas.map((m) => {
                const tonalidadeInicial = tomParaSelecao(tonalidadeAtual(m.id) || m.tonalidade);
                return (
                  <div key={m.id} className="flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/[0.06] py-1.5 pl-3 pr-1.5">
                    <span className="min-w-0 text-sm text-paper/90">
                      {m.titulo}
                      {m.artista && <span className="block text-[11px] text-muted">{m.artista}</span>}
                    </span>
                    <div className="w-24 shrink-0">
                      <Select
                        name={`tonalidade_${m.id}`}
                        defaultValue={tonalidadeInicial}
                        aria-label={`Tom de ${m.titulo}`}
                        className="px-2 py-1 text-xs"
                        options={[
                          { value: "", label: "Tom" },
                          ...TONALIDADES_MAIORES.map((tonalidade) => ({
                            value: tonalidade,
                            label: tonalidade,
                          })),
                        ]}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleMusica(m)}
                      aria-label={`Remover ${m.titulo}`}
                      title="Remover"
                      className="db-icon-button h-7 w-7 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <label className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={musicaBusca}
            onChange={(event) => setMusicaBusca(event.target.value)}
            placeholder="Pesquisar músicas..."
            className="db-input w-full !pl-10"
            aria-label="Pesquisar músicas para a escala"
          />
        </label>

        <div ref={listaRef} className="db-card db-scale-music-list max-h-64 overflow-y-auto p-3">
          {carregando && totalCarregado === 0 ? (
            <p className="text-sm text-muted">Carregando músicas...</p>
          ) : erroCarregar ? (
            <p className="text-sm text-red-400">Não foi possível carregar as músicas. Tente novamente.</p>
          ) : totalCarregado === 0 ? (
            <p className="text-sm text-muted">Nenhuma música encontrada.</p>
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
                    <span className="min-w-0">
                      {m.titulo}
                      {m.artista && <span className="text-muted"> — {m.artista}</span>}
                    </span>
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

      <div className="db-form-actions flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => onCancel ? onCancel() : router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}