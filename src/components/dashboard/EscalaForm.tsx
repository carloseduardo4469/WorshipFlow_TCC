"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { criarEscalaAction, atualizarEscalaAction } from "@/lib/actions/escalas";
import { buscarUsuarios, buscarUsuariosPorIds } from "@/lib/actions/usuarios";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { usePaginacaoDeslizante } from "./usePaginacaoDeslizante";
import type { Escala, Usuario } from "@/types/domain";
import { FORM_LIMITS } from "@/lib/validation/forms";

const NOMES_FUNCOES: Record<string, string> = {
  violao: "Violão",
  guitarra: "Guitarra",
  bateria: "Bateria",
  teclado: "Teclado",
  baixo: "Baixo",
  "voz-principal": "Cantor(a) principal",
  "voz-secundaria": "Voz secundária",
};

export function EscalaForm({
  escala,
  usuarios,
  onCancel,
}: {
  escala?: Escala;
  usuarios: Usuario[];
  onCancel?: () => void;
}) {
  const action = escala ? atualizarEscalaAction : criarEscalaAction;
  const [state, formAction, pending] = useActionState(action, null);
  const [erroAberto, setErroAberto] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state?.error) setErroAberto(true);
  }, [state]);

  const [usuarioIds, setUsuarioIds] = useState<Set<string>>(new Set(escala?.usuarioIds ?? []));
  const [usuariosSelecionados, setUsuariosSelecionados] = useState<Usuario[]>(
    [...new Map(usuarios.filter((usuario) => escala?.usuarioIds.includes(usuario.id)).map((usuario) => [usuario.id, usuario])).values()]
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

  const hoje = new Date();
  const dataMinima = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

  const funcaoAtual = (usuarioId: string) =>
    escala?.funcoesUsuarios.find((f) => f.usuarioId === usuarioId)?.funcao ?? "";

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

  return (
    <form action={formAction} className="db-panel db-scale-form flex w-full max-w-2xl flex-col gap-5 p-4 text-left sm:gap-6 sm:p-8">
      {escala && <input type="hidden" name="id" value={escala.id} />}

      <div className="flex flex-col gap-4">
        <Input label="Título" name="titulo" defaultValue={escala?.titulo} maxLength={FORM_LIMITS.nomeGenerico} required />

        <Input
          label="Data"
          name="dataEscala"
          type="date"
          min={dataMinima}
          defaultValue={escala?.dataEscala ?? ""}
          required
          className="db-date-input w-full sm:max-w-64"
        />

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
                    <span className="db-scale-person-name min-w-0 truncate text-sm font-semibold text-paper/90">{u.nome}</span>
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
                <label className="db-scale-person-name flex flex-1 items-center gap-2 text-sm text-paper/80">
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

      <div className="db-form-actions flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => onCancel ? onCancel() : router.back()}>
          Cancelar
        </Button>
      </div>

      {state?.error && erroAberto && (
        <div
          role="presentation"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020817]/70 p-4 backdrop-blur-sm"
          onMouseDown={() => setErroAberto(false)}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="erro-escala-titulo"
            className="db-panel w-full max-w-md p-5 text-left shadow-2xl sm:p-7"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <p className="db-label text-amber-300">Verifique a escala</p>
            <h2 id="erro-escala-titulo" className="db-title mt-2 text-2xl text-paper">
              Não foi possível salvar
            </h2>
            <div className="mt-4">
              <FormAlert>{state.error}</FormAlert>
            </div>
            <button
              type="button"
              onClick={() => setErroAberto(false)}
              className="db-btn-sm mt-6 w-full px-4 py-2.5 text-sm font-semibold sm:w-auto"
              autoFocus
            >
              Entendi
            </button>
          </section>
        </div>
      )}
    </form>
  );
}
