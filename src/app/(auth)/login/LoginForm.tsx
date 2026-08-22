"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, loginComGoogleAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormAlert } from "@/components/ui/FormAlert";

const CADASTRO_MESSAGES: Record<string, string> = {
  "confirme-email": "Conta criada! Confira seu email para confirmar o cadastro.",
};

const RESET_MESSAGES: Record<string, string> = {
  "email-enviado": "Se esse email existir, enviamos um link de redefinição.",
  sucesso: "Senha redefinida. Faça login com a nova senha.",
  "link-expirado": "Esse link de redefinição já foi usado ou expirou. Solicite um novo.",
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const cadastroMsg = searchParams.get("cadastro");
  const resetMsg = searchParams.get("reset");
  const oauthError = searchParams.get("error");

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 font-display text-2xl font-bold text-paper">Entrar</h1>
        <p className="mb-6 text-sm text-muted">Acesse o WorshipFlow.</p>

        {cadastroMsg && CADASTRO_MESSAGES[cadastroMsg] && (
          <div className="mb-4">
            <FormAlert kind="success">{CADASTRO_MESSAGES[cadastroMsg]}</FormAlert>
          </div>
        )}
        {resetMsg && RESET_MESSAGES[resetMsg] && (
          <div className="mb-4">
            <FormAlert kind="success">{RESET_MESSAGES[resetMsg]}</FormAlert>
          </div>
        )}
        {oauthError && (
          <div className="mb-4">
            <FormAlert>Não foi possível entrar com o Google. Tente novamente.</FormAlert>
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />
          <Input label="Email" name="email" type="email" autoComplete="email" required />
          <Input label="Senha" name="senha" type="password" autoComplete="current-password" required />

          {state?.error && <FormAlert>{state.error}</FormAlert>}

          <div className="flex justify-end">
            <Link href="/esqueci-senha" className="text-xs text-muted hover:text-paper">
              Esqueci minha senha
            </Link>
          </div>

          <Button type="submit" disabled={pending} className="mt-2 w-full">
            {pending ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted">
          <div className="h-px flex-1 bg-paper/10" />
          ou
          <div className="h-px flex-1 bg-paper/10" />
        </div>

        <form action={loginComGoogleAction}>
          <input type="hidden" name="next" value={next} />
          <Button type="submit" variant="ghost" className="w-full">
            Entrar com Google
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Não tem conta?{" "}
          <Link href="/cadastro" className="text-amber hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </main>
  );
}
