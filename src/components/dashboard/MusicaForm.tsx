"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { criarMusicaAction, atualizarMusicaAction } from "@/lib/actions/musicas";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import type { Ministerio, Musica } from "@/types/domain";

export function MusicaForm({
  musica,
  ministerios,
  onCancel,
}: {
  musica?: Musica;
  ministerios: Ministerio[];
  onCancel?: () => void;
}) {
  const action = musica ? atualizarMusicaAction : criarMusicaAction;
  const [state, formAction, pending] = useActionState(action, null);
  const router = useRouter();

  return (
    <form action={formAction} className="db-panel flex max-w-lg flex-col gap-5 p-6 text-left sm:p-8">
      {musica && <input type="hidden" name="id" value={musica.id} />}

      <Input label="Título" name="titulo" defaultValue={musica?.titulo} required />
      <Input label="Artista" name="artista" defaultValue={musica?.artista ?? ""} />

      <div className="flex flex-col gap-4 sm:flex-row">
        <Input
          label="Tonalidade"
          name="tonalidade"
          defaultValue={musica?.tonalidade ?? ""}
          placeholder="Ex: G, Am, D"
          className="w-full sm:w-32"
        />
        <Input
          label="BPM"
          name="bpm"
          type="number"
          defaultValue={musica?.bpm ?? ""}
          className="w-full sm:w-32"
        />
      </div>

      <Input
        label="Link da cifra"
        name="linkCifra"
        type="url"
        defaultValue={musica?.linkCifra ?? ""}
        placeholder="https://..."
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ministerioId" className="db-label">
          Ministério
        </label>
        <select
          id="ministerioId"
          name="ministerioId"
          defaultValue={musica?.ministerioId ?? ""}
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

      {state?.error && <FormAlert>{state.error}</FormAlert>}

      <div className="db-form-actions mt-2 flex gap-3">
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
