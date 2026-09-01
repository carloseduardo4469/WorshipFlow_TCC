"use client";

import { useActionState } from "react";
import { esqueciSenhaAction } from "@/lib/actions/auth";
import { FormAlert } from "@/components/ui/FormAlert";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { Showcase } from "@/components/auth/Showcase";
import {
  AuthBadge,
  AuthField,
  GhostPillLink,
  PrimaryButton,
} from "@/components/auth/AuthUi";
import { FORM_LIMITS } from "@/lib/validation/forms";

export default function EsqueciSenhaPage() {
  const [state, formAction, pending] = useActionState(esqueciSenhaAction, null);

  return (
    <AuthShell>
      <AuthCard
        formSide="left"
        showcase={
          <Showcase
            title={
              <>
                Acesso
                <br />
                protegido.
              </>
            }
            subtitle="Recupere sua senha com segurança e continue acompanhando a rotina do ministério."
            ctaHref="/cadastro"
            ctaLabel="Criar cadastro"
          />
        }
      >
        <div className="flex flex-col">
          <div className="mb-6">
            <AuthBadge size={76} />
          </div>

          <p className="af-label mb-3" style={{ color: "#f2c14e" }}>
            Recuperação
          </p>
          <h1 className="mb-4 max-w-xs font-serif text-5xl font-black leading-[1.02] af-text">
            Redefinir senha
          </h1>
          <p className="mb-8 max-w-sm text-[15px] font-semibold leading-relaxed af-muted">
            Informe seu e-mail para receber um link temporário de recuperação.
          </p>

          <form action={formAction} className="flex flex-col gap-5">
            <AuthField
              label="E-mail"
              name="email"
              type="email"
              placeholder="Digite seu e-mail"
              autoComplete="email"
              maxLength={FORM_LIMITS.email}
              required
            />

            {state?.error && <FormAlert>{state.error}</FormAlert>}

            <div className="mt-2">
              <PrimaryButton disabled={pending}>
                {pending ? "Enviando..." : "Enviar Link"}
              </PrimaryButton>
            </div>
          </form>

          <div className="mt-7 flex justify-center">
            <GhostPillLink href="/login">Voltar para login</GhostPillLink>
          </div>
        </div>
      </AuthCard>

    </AuthShell>
  );
}
