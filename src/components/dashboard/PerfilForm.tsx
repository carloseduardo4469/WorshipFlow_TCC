"use client";

import { useActionState } from "react";
import { atualizarPerfilAction } from "@/lib/actions/usuarios";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import type { Usuario } from "@/types/domain";

export function PerfilForm({ usuario }: { usuario: Usuario }) {
  const [state, formAction, pending] = useActionState(atualizarPerfilAction, null);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <Input label="Nome" name="nome" defaultValue={usuario.nome} required />
      <Input label="Telefone" name="telefone" defaultValue={usuario.telefone ?? ""} />
      <Input
        label="Instrumento principal"
        name="instrumentoPrincipal"
        defaultValue={usuario.instrumentoPrincipal ?? ""}
        placeholder="Ex: Violão, Vocal, Bateria"
      />
      <Input
        label="Outras habilidades"
        name="habilidades"
        defaultValue={usuario.habilidades ?? ""}
        placeholder="Ex: Backing vocal, Direção"
      />

      {state?.error && <FormAlert>{state.error}</FormAlert>}
      {state?.success && <FormAlert kind="success">Perfil atualizado.</FormAlert>}

      <div className="mt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
