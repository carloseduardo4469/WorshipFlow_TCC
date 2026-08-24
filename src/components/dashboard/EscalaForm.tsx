"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { criarEscalaAction, atualizarEscalaAction } from "@/lib/actions/escalas";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import type { Escala, Ministerio, Musica, StatusEscala, Usuario } from "@/types/domain";

const STATUS_OPTIONS: { value: StatusEscala; label: string }[] = [
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "PUBLICADA", label: "Publicada" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "CANCELADA", label: "Cancelada" },
];

export function EscalaForm({
  escala,
  usuarios,
  musicas,
  ministerios,
}: {
  escala?: Escala;
  usuarios: Usuario[];
  musicas: Musica[];
  ministerios: Ministerio[];
}) {
  const action = escala ? atualizarEscalaAction : criarEscalaAction;
  const [state, formAction, pending] = useActionState(action, null);
  const router = useRouter();

  const [usuarioIds, setUsuarioIds] = useState<Set<string>>(new Set(escala?.usuarioIds ?? []));
  const [musicaIds, setMusicaIds] = useState<Set<number>>(new Set(escala?.musicaIds ?? []));

  const funcaoAtual = (usuarioId: string) =>
    escala?.funcoesUsuarios.find((f) => f.usuarioId === usuarioId)?.funcao ?? "";
  const tonalidadeAtual = (musicaId: number) =>
    escala?.tonalidadesMusicas.find((t) => t.musicaId === musicaId)?.tonalidade ?? "";

  function toggleUsuario(id: string) {
    setUsuarioIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleMusica(id: number) {
    setMusicaIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
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
            defaultValue={escala?.dataEscala ?? ""}
            className="w-full sm:w-48"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="db-label">
              Estado
            </label>
            <select
              id="status"
              name="status"
              defaultValue={escala?.status ?? "RASCUNHO"}
              className="db-select"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="ministerioId" className="db-label">
              Ministério
            </label>
            <select
              id="ministerioId"
              name="ministerioId"
              defaultValue={escala?.ministerioId ?? ""}
              className="db-select"
            >
              <option value="">Nenhum</option>
              {ministerios.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
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
            return (
              <div key={u.id} className="flex items-center gap-3 py-1.5">
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
                  <input
                    type="text"
                    name={`funcao_${u.id}`}
                    defaultValue={funcaoAtual(u.id)}
                    placeholder="Função (ex: Vocal, Baixo)"
                    className="db-input w-48 px-2 py-1 text-xs"
                  />
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="db-label mb-1">Músicas</legend>
        <div className="db-card max-h-72 space-y-1 overflow-y-auto p-3">
          {musicas.length === 0 && <p className="text-sm text-muted">Nenhuma música cadastrada.</p>}
          {musicas.map((m) => {
            const checked = musicaIds.has(m.id);
            return (
              <div key={m.id} className="flex items-center gap-3 py-1.5">
                <label className="flex flex-1 items-center gap-2 text-sm text-paper/80">
                  <input
                    type="checkbox"
                    name="musicaIds"
                    value={m.id}
                    checked={checked}
                    onChange={() => toggleMusica(m.id)}
                    className="h-4 w-4 db-checkbox"
                  />
                  {m.titulo}
                </label>
                {checked && (
                  <input
                    type="text"
                    name={`tonalidade_${m.id}`}
                    defaultValue={tonalidadeAtual(m.id) || m.tonalidade || ""}
                    placeholder="Tom (ex: G)"
                    className="db-input w-28 px-2 py-1 text-xs"
                  />
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      {state?.error && <FormAlert>{state.error}</FormAlert>}

      <div className="db-form-actions flex gap-3">
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
