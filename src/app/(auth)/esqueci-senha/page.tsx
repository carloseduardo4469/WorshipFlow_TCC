"use client";

import { useActionState } from "react";
import Link from "next/link";
import { esqueciSenhaAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormAlert } from "@/components/ui/FormAlert";

export default function EsqueciSenhaPage() {
  const [state, formAction, pending] = useActionState(esqueciSenhaAction, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 font-display text-2xl font-bold text-paper">Redefinir senha</h1>
        <p className="mb-6 text-sm text-muted">
          Informe seu email e enviaremos um link para redefinir sua senha.
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          <Input label="Email" name="email" type="email" autoComplete="email" required />

          {state?.error && <FormAlert>{state.error}</FormAlert>}

          <Button type="submit" disabled={pending} className="mt-2 w-full">
            {pending ? "Enviando..." : "Enviar link"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="text-amber hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </main>
  );
}
