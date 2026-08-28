"use client";

import { useActionState, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { criarEscalaAction, atualizarEscalaAction } from "@/lib/actions/escalas";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
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
  onCancel,
}: {
  escala?: Escala;
  usuarios: Usuario[];
  musicas: Musica[];
  ministerios: Ministerio[];
  onCancel?: () => void;
}) {
  const action = escala ? atualizarEscalaAction : criarEscalaAction;
  const [state, formAction, pending] = useActionState(action, null);
  const router = useRouter();

  const [usuarioIds, setUsuarioIds] = useState<Set<string>>(new Set(escala?.usuarioIds ?? []));
  const [musicaIds, setMusicaIds] = useState<Set<number>>(new Set(escala?.musicaIds ?? []));
  const [musicaBusca, setMusicaBusca] = useState("");

  const funcaoAtual = (usuarioId: string) =>
    escala?.funcoesUsuarios.find((f) => f.usuarioId === usuarioId)?.funcao ?? "";
  const tonalidadeAtual = (musicaId: number) =>
    escala?.tonalidadesMusicas.find((t) => t.musicaId === musicaId)?.tonalidade ?? "";

  const musicasFiltradas = musicas.filter((musica) => {
    if (musicaIds.has(musica.id)) return true;
    const termo = musicaBusca.trim().toLocaleLowerCase();
    if (!termo) return true;
    return `${musica.titulo} ${musica.artista ?? ""}`.toLocaleLowerCase().includes(termo);
  });

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
          <DatePicker name="dataEscala" defaultValue={escala?.dataEscala} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="db-label">
              Estado
            </label>
            <Select
              id="status"
              name="status"
              defaultValue={escala?.status ?? "RASCUNHO"}
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
        <div className="db-card max-h-72 space-y-1 overflow-y-auto p-3">
          {musicas.length === 0 && <p className="text-sm text-muted">Nenhuma música cadastrada.</p>}
          {musicas.length > 0 && musicasFiltradas.length === 0 && <p className="text-sm text-muted">Nenhuma música encontrada.</p>}
          {musicasFiltradas.map((m) => {
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
        <Button type="button" variant="ghost" onClick={() => onCancel ? onCancel() : router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
