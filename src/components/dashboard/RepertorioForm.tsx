"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { criarRepertorioAction, atualizarRepertorioAction } from "@/lib/actions/repertorios";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import type { Ministerio, Musica, Repertorio } from "@/types/domain";

export function RepertorioForm({
  repertorio,
  musicas,
  ministerios,
}: {
  repertorio?: Repertorio;
  musicas: Musica[];
  ministerios: Ministerio[];
}) {
  const action = repertorio ? atualizarRepertorioAction : criarRepertorioAction;
  const [state, formAction, pending] = useActionState(action, null);
  const router = useRouter();

  return (
    <form action={formAction} className="db-panel flex max-w-lg flex-col gap-5 p-6 sm:p-8">
      {repertorio && <input type="hidden" name="id" value={repertorio.id} />}

      <Input label="Nome" name="nome" defaultValue={repertorio?.nome} required />
      <Input label="Descrição" name="descricao" defaultValue={repertorio?.descricao ?? ""} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ministerioId" className="db-label">
          Ministério
        </label>
        <select
          id="ministerioId"
          name="ministerioId"
          defaultValue={repertorio?.ministerioId ?? ""}
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

      <fieldset className="flex flex-col gap-2">
        <legend className="db-label mb-1">Músicas</legend>
        <div className="db-card max-h-64 space-y-1 overflow-y-auto p-3">
          {musicas.length === 0 && <p className="text-sm text-muted">Nenhuma música cadastrada.</p>}
          {musicas.map((m) => (
            <label key={m.id} className="flex items-center gap-2 py-1 text-sm text-paper/80">
              <input
                type="checkbox"
                name="musicaIds"
                value={m.id}
                defaultChecked={repertorio?.musicaIds.includes(m.id)}
                className="h-4 w-4 db-checkbox"
              />
              {m.titulo} {m.artista && <span className="text-muted">— {m.artista}</span>}
            </label>
          ))}
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
