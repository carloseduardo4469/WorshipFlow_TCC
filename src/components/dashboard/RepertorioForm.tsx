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
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      {repertorio && <input type="hidden" name="id" value={repertorio.id} />}

      <Input label="Nome" name="nome" defaultValue={repertorio?.nome} required />
      <Input label="Descrição" name="descricao" defaultValue={repertorio?.descricao ?? ""} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ministerioId" className="text-sm font-medium text-paper/80">
          Ministério
        </label>
        <select
          id="ministerioId"
          name="ministerioId"
          defaultValue={repertorio?.ministerioId ?? ""}
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

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-paper/80">Músicas</legend>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-paper/20 p-3">
          {musicas.length === 0 && <p className="text-sm text-muted">Nenhuma música cadastrada.</p>}
          {musicas.map((m) => (
            <label key={m.id} className="flex items-center gap-2 py-1 text-sm text-paper/80">
              <input
                type="checkbox"
                name="musicaIds"
                value={m.id}
                defaultChecked={repertorio?.musicaIds.includes(m.id)}
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
