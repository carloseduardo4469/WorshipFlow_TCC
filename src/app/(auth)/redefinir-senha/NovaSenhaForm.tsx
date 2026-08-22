"use client";

import { useActionState } from "react";
import { redefinirSenhaAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormAlert } from "@/components/ui/FormAlert";

export function NovaSenhaForm() {
  const [state, formAction, pending] = useActionState(redefinirSenhaAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        label="Nova senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Input
        label="Confirmar nova senha"
        name="confirmarSenha"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />

      {state?.error && <FormAlert>{state.error}</FormAlert>}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}