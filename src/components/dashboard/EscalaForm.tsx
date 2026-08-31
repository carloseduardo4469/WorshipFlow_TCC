"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { criarEscalaAction, atualizarEscalaAction } from "@/lib/actions/escalas";
import { buscarMusicas, buscarMusicasPorIds } from "@/lib/actions/musicas";
import { buscarUsuarios, buscarUsuariosPorIds } from "@/lib/actions/usuarios";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { TONALIDADES_MAIORES, tomParaSelecao } from "@/lib/music/tonalidades";
import { usePaginacaoDeslizante } from "./usePaginacaoDeslizante";
import type { Escala, Ministerio, Musica, StatusEscala, Usuario } from "@/types/domain";
import { FORM_LIMITS, normalizeSearch } from "@/lib/validation/forms";

const STATUS_OPTIONS: { value: StatusEscala; label: string }[] = [
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "PUBLICADA", label: "Publicada" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "CANCELADA", label: "Cancelada" },
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
  const [usuariosSelecionados, setUsuariosSelecionados] = useState<Usuario[]>(
    [...new Map(usuarios.filter((usuario) => escala?.usuarioIds.includes(usuario.id)).map((usuario) => [usuario.id, usuario])).values()]
  );
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

  const buscaUsuariosPaginada = useCallback(
    (offset: number, limite: number) => buscarUsuarios(offset, limite),
    []
  );

  const {
    containerRef: usuariosListaRef,
    sentinelaRef: usuariosSentinelaRef,
    itensVisiveis: usuariosVisiveis,
    topoAltura: usuariosTopoAltura,
    fundoAltura: usuariosFundoAltura,
    carregando: usuariosCarregando,
    carregandoMais: usuariosCarregandoMais,
    temMais: usuariosTemMais,
    erro: usuariosErro,
    totalCarregado: usuariosTotalCarregado,
    refLinha: refLinhaUsuario,
  } = usePaginacaoDeslizante<Usuario>({
    chaveDeItem: (usuario) => usuario.id,
    buscaPorPagina: buscaUsuariosPaginada,
    tamanhoPagina: 20,
    limiteDom: 40,
    alturaPadraoLinha: 36,
  });

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
        const porId = new Map(resultado.map((musica) => [musica.id, musica]));
        setMusicasSelecionadas(ids.map((id) => porId.get(id)).filter((musica): musica is Musica => Boolean(musica)));
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [escala]);

  useEffect(() => {
    const ids = escala?.usuarioIds ?? [];
    if (ids.length === 0) return;
    const conhecidos = new Set(usuarios.map((usuario) => usuario.id));
    const idsFaltantes = ids.filter((id) => !conhecidos.has(id));
    if (idsFaltantes.length === 0) return;
    let ativo = true;
    buscarUsuariosPorIds(idsFaltantes)
      .then((resultado) => {
        if (!ativo) return;
        const ordem = new Map(ids.map((id, indice) => [id, indice]));
        setUsuariosSelecionados((atuais) => [...new Map([...atuais, ...resultado].map((usuario) => [usuario.id, usuario])).values()]
          .sort((a, b) => (ordem.get(a.id) ?? 0) - (ordem.get(b.id) ?? 0)));
      })
      .catch(() => {});
    return () => { ativo = false; };
  }, [escala, usuarios]);

  function toggleUsuario(usuario: Usuario) {
    setUsuarioIds((prev) => {
      const next = new Set(prev);
      if (next.has(usuario.id)) {
        next.delete(usuario.id);
        setUsuariosSelecionados((atuais) => atuais.filter((atual) => atual.id !== usuario.id));
      } else {
        next.add(usuario.id);
        setUsuariosSelecionados((atuais) => atuais.some((atual) => atual.id === usuario.id) ? atuais : [...atuais, usuario]);
      }
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
    <form action={formAction} className="db-panel db-scale-form flex max-w-2xl flex-col gap-6 p-6 text-left sm:p-8">
      {escala && <input type="hidden" name="id" value={escala.id} />}

      <div className="flex flex-col gap-4">
        <Input label="Título" name="titulo" defaultValue={escala?.titulo} maxLength={FORM_LIMITS.nomeGenerico} required />

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
              Status
            </label>
            <Select
              id="status"
              name="status"
              defaultValue={escala?.status ?? "PUBLICADA"}
              aria-label="Status"
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

        <Input label="Observações" name="observacoes" defaultValue={escala?.observacoes ?? ""} maxLength={FORM_LIMITS.observacoes} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="db-label mb-1">Equipe escalada</legend>
        {[...usuarioIds].map((id) => <input key={id} type="hidden" name="usuarioIds" value={id} />)}

        {usuariosSelecionados.length > 0 && (
          <div className="mb-2 flex flex-col gap-2">
            <span className="db-label db-scale-section-label text-xs">Equipe selecionada ({usuariosSelecionados.length})</span>
            {usuariosSelecionados.map((u) => {
              const funcoes = [...new Set((u.habilidades ?? "").split(",").map((funcao) => funcao.trim()).filter(Boolean))];
              const funcoesSelecionadas = new Set(funcaoAtual(u.id).split(",").map((funcao) => funcao.trim()).filter(Boolean));
              return (
                <div key={u.id} className="db-scale-selected-person rounded-xl p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm font-semibold text-paper/90">{u.nome}</span>
                    <button type="button" onClick={() => toggleUsuario(u)} aria-label={`Remover ${u.nome}`} className="db-icon-button h-7 w-7 shrink-0"><X size={14} /></button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
                    {funcoes.length > 0 ? funcoes.map((funcao) => (
                      <label key={funcao} className="flex items-center gap-1.5 text-xs text-paper/80">
                        <input type="checkbox" name={`funcao_${u.id}`} value={funcao} defaultChecked={funcoesSelecionadas.has(funcao)} className="h-3.5 w-3.5 db-checkbox" />
                        {NOMES_FUNCOES[funcao] ?? funcao}
                      </label>
                    )) : <span className="text-xs text-muted">Nenhuma função cadastrada.</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <span className="db-hint">Adicionar membros</span>
        <div ref={usuariosListaRef} className="db-card db-scale-picker max-h-72 space-y-1 overflow-y-auto p-3">
          {usuariosCarregando && usuariosTotalCarregado === 0 ? (
            <p className="text-sm text-muted">Carregando membros...</p>
          ) : usuariosErro ? (
            <p className="text-sm text-red-400">Não foi possível carregar os membros.</p>
          ) : usuariosTotalCarregado === 0 ? (
            <p className="text-sm text-muted">Nenhum membro cadastrado.</p>
          ) : null}
          {usuariosTopoAltura > 0 && <div aria-hidden="true" style={{ height: usuariosTopoAltura }} />}
          {usuariosVisiveis.filter((u) => !usuarioIds.has(u.id)).map((u) => {
            return (
              <div key={u.id} ref={refLinhaUsuario(u)} className="db-scale-option py-1.5">
                <label className="flex flex-1 items-center gap-2 text-sm text-paper/80">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggleUsuario(u)}
                    className="h-4 w-4 db-checkbox"
                  />
                  {u.nome}
                </label>
              </div>
            );
          })}
          {usuariosFundoAltura > 0 && <div aria-hidden="true" style={{ height: usuariosFundoAltura }} />}
          <div ref={usuariosSentinelaRef} className="h-px" aria-hidden="true" />
          {usuariosCarregandoMais && <p className="py-2 text-center text-xs text-muted">Carregando mais...</p>}
          {!usuariosCarregandoMais && !usuariosTemMais && usuariosTotalCarregado > 0 && <p className="py-2 text-center text-xs text-muted">Todos os membros foram carregados.</p>}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="db-label mb-1">Músicas</legend>

        {[...musicaIds].map((id) => (
          <input key={id} type="hidden" name="musicaIds" value={id} />
        ))}

        {musicasSelecionadas.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="db-label db-scale-section-label text-xs">
              Músicas selecionadas ({musicasSelecionadas.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {musicasSelecionadas.map((m) => {
                const tonalidadeInicial = tomParaSelecao(tonalidadeAtual(m.id) || m.tonalidade);
                return (
                  <div key={m.id} className="db-scale-selected-song flex items-center gap-2 rounded-xl py-1.5 pl-3 pr-1.5">
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

        <span className="db-hint">Adicionar músicas</span>
        <label className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={musicaBusca}
            onChange={(event) => setMusicaBusca(normalizeSearch(event.target.value))}
            maxLength={FORM_LIMITS.busca}
            placeholder="Pesquisar músicas..."
            className="db-input w-full !pl-10"
            aria-label="Pesquisar músicas para a escala"
          />
        </label>

        <div ref={listaRef} className="db-card db-scale-picker db-scale-music-list max-h-64 overflow-y-auto p-3">
          {carregando && totalCarregado === 0 ? (
            <p className="text-sm text-muted">Carregando músicas...</p>
          ) : erroCarregar ? (
            <p className="text-sm text-red-400">Não foi possível carregar as músicas. Tente novamente.</p>
          ) : totalCarregado === 0 ? (
            <p className="text-sm text-muted">Nenhuma música encontrada.</p>
          ) : (
            <>
              {topoAltura > 0 && <div aria-hidden="true" style={{ height: topoAltura }} />}
              {itensVisiveis.filter((m) => !musicaIds.has(m.id)).map((m) => {
                return (
                  <label
                    key={m.id}
                    ref={refLinha(m)}
                    className="db-scale-option flex min-w-0 cursor-pointer items-start gap-2 break-words py-1 text-sm text-paper/80"
                  >
                    <input
                      type="checkbox"
                      checked={false}
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
