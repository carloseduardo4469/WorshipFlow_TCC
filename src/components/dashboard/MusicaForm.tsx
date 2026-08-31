"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { criarMusicaAction, atualizarMusicaAction } from "@/lib/actions/musicas";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { TONALIDADES_MAIORES, tomParaSelecao } from "@/lib/music/tonalidades";
import type { Musica } from "@/types/domain";

export function MusicaForm({
  musica,
  onCancel,
}: {
  musica?: Musica;
  onCancel?: () => void;
}) {
  const action = musica ? atualizarMusicaAction : criarMusicaAction;
  const [state, formAction, pending] = useActionState(action, null);
  const router = useRouter();
  const tonalidadeInicial = tomParaSelecao(musica?.tonalidade);

  return (
    <form action={formAction} className="db-panel flex max-w-lg flex-col gap-5 p-6 text-left sm:p-8">
      {musica && <input type="hidden" name="id" value={musica.id} />}

      <Input label="Título" name="titulo" defaultValue={musica?.titulo} required />
      <Input label="Artista" name="artista" defaultValue={musica?.artista ?? ""} required />

      <div className="flex w-full flex-col gap-2 sm:w-48">
        <label htmlFor="tonalidade" className="db-label">
          Tonalidade
        </label>
        <Select
          id="tonalidade"
          name="tonalidade"
          defaultValue={tonalidadeInicial}
          aria-label="Tonalidade"
          options={[
            { value: "", label: "Nenhum" },
            ...TONALIDADES_MAIORES.map((tonalidade) => ({
              value: tonalidade,
              label: tonalidade,
            })),
          ]}
        />
      </div>

      <p className="text-xs leading-relaxed text-muted">
        Só tons maiores. Música em tom menor? Escolha o tom maior relativo (ex.: E) e a cifra abre na relativa menor (C#m).
      </p>

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
