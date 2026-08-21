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
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      {escala && <input type="hidden" name="id" value={escala.id} />}

      <div className="flex flex-col gap-4">
        <Input label="Título" name="titulo" defaultValue={escala?.titulo} required />

        <div className="flex gap-4">
          <Input
            label="Data"
            name="dataEscala"
            type="date"
            defaultValue={escala?.dataEscala ?? ""}
            className="w-48"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-sm font-medium text-paper/80">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={escala?.status ?? "RASCUNHO"}
              className="rounded-lg border border-paper/20 bg-ink px-4 py-2.5 text-paper focus:border-amber focus:outline-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="ministerioId" className="text-sm font-medium text-paper/80">
              Ministério
            </label>
            <select
              id="ministerioId"
              name="ministerioId"
              defaultValue={escala?.ministerioId ?? ""}
              className="rounded-lg border border-paper/20 bg-ink px-4 py-2.5 text-paper focus:border-amber focus:outline-none"
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
        <legend className="mb-1 text-sm font-medium text-paper/80">Equipe escalada</legend>
        <div className="max-h-72 overflow-y-auto rounded-lg border border-paper/20 p-3">
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
                  />
                  {u.nome}
                </label>
                {checked && (
                  <input
                    type="text"
                    name={`funcao_${u.id}`}
                    defaultValue={funcaoAtual(u.id)}
                    placeholder="Função (ex: Vocal, Baixo)"
                    className="w-48 rounded-md border border-paper/20 bg-ink px-2 py-1 text-xs text-paper placeholder:text-muted focus:border-amber focus:outline-none"
                  />
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-paper/80">Músicas</legend>
        <div className="max-h-72 overflow-y-auto rounded-lg border border-paper/20 p-3">
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
                  />
                  {m.titulo}
                </label>
                {checked && (
                  <input
                    type="text"
                    name={`tonalidade_${m.id}`}
                    defaultValue={tonalidadeAtual(m.id) || m.tonalidade || ""}
                    placeholder="Tom (ex: G)"
                    className="w-28 rounded-md border border-paper/20 bg-ink px-2 py-1 text-xs text-paper placeholder:text-muted focus:border-amber focus:outline-none"
                  />
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      {state?.error && <FormAlert>{state.error}</FormAlert>}

      <div className="flex gap-3">
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
