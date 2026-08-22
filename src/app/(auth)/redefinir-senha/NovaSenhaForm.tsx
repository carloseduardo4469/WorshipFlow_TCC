"use client";

import { useActionState } from "react";
import { redefinirSenhaAction } from "@/lib/actions/auth";
import { FormAlert } from "@/components/ui/FormAlert";
import { AuthField, PrimaryButton } from "@/components/auth/AuthUi";

export function NovaSenhaForm() {
  const [state, formAction, pending] = useActionState(redefinirSenhaAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <AuthField
        label="Nova senha"
        name="senha"
        type="password"
        placeholder="Mínimo de 8 caracteres"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <AuthField
        label="Confirmar nova senha"
        name="confirmarSenha"
        type="password"
        placeholder="Repita a nova senha"
        autoComplete="new-password"
        minLength={8}
        required
      />

      {state?.error && <FormAlert>{state.error}</FormAlert>}

      <div className="mt-2">
        <PrimaryButton disabled={pending}>
          {pending ? "Salvando..." : "Salvar nova senha"}
        </PrimaryButton>
      </div>
    </form>
  );
}