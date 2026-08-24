"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { criarMinisterioAction, atualizarMinisterioAction } from "@/lib/actions/ministerios";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import type { Ministerio } from "@/types/domain";

export function MinisterioForm({ ministerio }: { ministerio?: Ministerio }) {
  const action = ministerio ? atualizarMinisterioAction : criarMinisterioAction;
  const [state, formAction, pending] = useActionState(action, null);
  const router = useRouter();

  return (
    <form action={formAction} className="db-panel flex max-w-lg flex-col gap-5 p-6 text-left sm:p-8">
      {ministerio && <input type="hidden" name="id" value={ministerio.id} />}

      <Input label="Nome" name="nome" defaultValue={ministerio?.nome} required />
      <Input label="Descrição" name="descricao" defaultValue={ministerio?.descricao ?? ""} />

      {ministerio && (
        <label className="flex items-center gap-2 text-sm text-paper/80">
          <input type="checkbox" name="ativo" defaultChecked={ministerio.ativo} className="h-4 w-4 db-checkbox" />
          Ministério ativo
        </label>
      )}

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
