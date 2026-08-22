"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, loginComGoogleAction } from "@/lib/actions/auth";
import { FormAlert } from "@/components/ui/FormAlert";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { Showcase } from "@/components/auth/Showcase";
import {
  AuthBadge,
  AuthField,
  GhostPillLink,
  GhostUnderlineLink,
  PrimaryButton,
} from "@/components/auth/AuthUi";
import { AuthMiniFooter } from "@/components/auth/AuthMiniFooter";

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

  // O Supabase anexa o detalhe do erro de OAuth no fragment (#error=...),
  // que nunca chega ao servidor. Logamos aqui pra facilitar o diagnóstico
  // (ex.: "Unable to exchange external code" = client secret/redirect URI
  // do provedor Google) e limpamos o fragment da URL.
  useEffect(() => {
    if (!window.location.hash) return;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (hashParams.get("error")) {
      console.error(
        "[login] Erro retornado pelo Supabase Auth:",
        hashParams.get("error"),
        hashParams.get("error_code"),
        hashParams.get("error_description")
      );
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  return (
    <AuthShell>
      <AuthCard
        formSide="left"
        showcase={
          <Showcase
            title={
              <>
                Bem-vindo ao
                <br />
                WorshipFlow.
              </>
            }
            subtitle="Organize escalas, repertórios e equipes do ministério de louvor em um único ambiente."
            ctaHref="/cadastro"
            ctaLabel="Criar cadastro"
          />
        }
      >
        <div className="flex flex-col">
          <div className="mb-7">
            <AuthBadge size={88} />
          </div>

          <p className="af-label mb-3" style={{ color: "#67e8f9" }}>
            Acesso Ministerial
          </p>
          <h1 className="mb-4 font-serif text-5xl font-black leading-[1.02] af-text">
            Entrar
          </h1>
          <p className="mb-8 max-w-sm text-[15px] font-semibold leading-relaxed af-muted">
            Acesse sua conta para acompanhar escalas, equipe e repertório.
          </p>

          {cadastroMsg && CADASTRO_MESSAGES[cadastroMsg] && (
            <div className="mb-5">
              <FormAlert kind="success">{CADASTRO_MESSAGES[cadastroMsg]}</FormAlert>
            </div>
          )}
          {resetMsg && RESET_MESSAGES[resetMsg] && (
            <div className="mb-5">
              <FormAlert kind="success">{RESET_MESSAGES[resetMsg]}</FormAlert>
            </div>
          )}
          {oauthError && (
            <div className="mb-5">
              <FormAlert>
                Não foi possível concluir o login com o Google. Tente novamente — se o erro
                persistir, a configuração do provedor Google precisa ser revisada.
              </FormAlert>
            </div>
          )}

          <form action={formAction} className="flex flex-col gap-5">
            <input type="hidden" name="next" value={next} />
            <AuthField
              label="E-mail"
              name="email"
              type="email"
              placeholder="Digite seu e-mail"
              autoComplete="email"
              required
            />
            <AuthField
              label="Senha"
              name="senha"
              type="password"
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
            />

            {state?.error && <FormAlert>{state.error}</FormAlert>}

            <div className="mt-3">
              <PrimaryButton disabled={pending}>
                {pending ? "Entrando..." : "Entrar"}
              </PrimaryButton>
            </div>
          </form>

          <div className="mt-4">
            <GhostUnderlineLink href="/cadastro">Cadastre-se</GhostUnderlineLink>
          </div>

          <p className="mt-5 text-center text-xs font-semibold leading-relaxed af-muted">
            Ao entrar, você concorda com os{" "}
            <Link
              href="/termos"
              className="underline underline-offset-2 transition hover:text-amber"
            >
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link
              href="/privacidade"
              className="underline underline-offset-2 transition hover:text-amber"
            >
              Política de Privacidade
            </Link>
            .
          </p>

          <div className="mt-7 flex justify-center">
            <GhostPillLink href="/esqueci-senha">Esqueci minha senha</GhostPillLink>
          </div>

          <form action={loginComGoogleAction} className="mt-3 flex justify-center">
            <input type="hidden" name="next" value={next} />
            <button type="submit" className="af-btn-pill">
              Entrar com Google
            </button>
          </form>
        </div>
      </AuthCard>

      <AuthMiniFooter />
    </AuthShell>
  );
}
