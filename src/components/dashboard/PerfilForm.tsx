"use client";

import { useActionState } from "react";
import { atualizarPerfilAction } from "@/lib/actions/usuarios";
import { Input, CheckboxGroup } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import type { Usuario } from "@/types/domain";

const OPCOES_HABILIDADES = [
  { value: "violao", label: "Violão" },
  { value: "guitarra", label: "Guitarra" },
  { value: "bateria", label: "Bateria" },
  { value: "teclado", label: "Teclado" },
  { value: "trompete", label: "Trompete" },
  { value: "baixo", label: "Baixo" },
  { value: "voz-principal", label: "Voz principal" },
  { value: "voz-secundaria", label: "Voz secundária" },
];

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
      <CheckboxGroup
        label="Habilidades"
        name="habilidades"
        options={OPCOES_HABILIDADES}
        defaultSelected={(usuario.habilidades ?? "")
          .split(",")
          .map((habilidade) => habilidade.trim())
          .filter(Boolean)}
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
