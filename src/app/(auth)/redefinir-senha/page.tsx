"use client";

import { useActionState } from "react";
import { redefinirSenhaAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormAlert } from "@/components/ui/FormAlert";

export default function RedefinirSenhaPage() {
  const [state, formAction, pending] = useActionState(redefinirSenhaAction, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 font-display text-2xl font-bold text-paper">Nova senha</h1>
        <p className="mb-6 text-sm text-muted">Escolha uma nova senha para sua conta.</p>

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
      </div>
    </main>
  );
}
