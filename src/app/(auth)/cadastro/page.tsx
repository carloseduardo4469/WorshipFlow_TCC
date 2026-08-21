"use client";

import { useActionState } from "react";
import Link from "next/link";
import { cadastroAction, loginComGoogleAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormAlert } from "@/components/ui/FormAlert";

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState(cadastroAction, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 font-display text-2xl font-bold text-paper">Criar conta</h1>
        <p className="mb-6 text-sm text-muted">Cadastre-se no WorshipFlow.</p>

        <form action={formAction} className="flex flex-col gap-4">
          <Input label="Nome" name="nome" type="text" autoComplete="name" required />
          <Input label="Email" name="email" type="email" autoComplete="email" required />
          <Input
            label="Senha"
            name="senha"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <Input
            label="Confirmar senha"
            name="confirmarSenha"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />

          {state?.error && <FormAlert>{state.error}</FormAlert>}

          <Button type="submit" disabled={pending} className="mt-2 w-full">
            {pending ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted">
          <div className="h-px flex-1 bg-paper/10" />
          ou
          <div className="h-px flex-1 bg-paper/10" />
        </div>

        <form action={loginComGoogleAction}>
          <input type="hidden" name="next" value="/dashboard" />
          <Button type="submit" variant="ghost" className="w-full">
            Cadastrar com Google
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Já tem conta?{" "}
          <Link href="/login" className="text-amber hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
