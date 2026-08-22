"use client";

import { useActionState } from "react";
import Link from "next/link";
import { cadastroAction, loginComGoogleAction } from "@/lib/actions/auth";
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

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState(cadastroAction, null);

  return (
    <AuthShell>
      <AuthCard
        formSide="right"
        wide
        showcase={
          <Showcase
            title={
              <>
                Já faz parte
                <br />
                da equipe?
              </>
            }
            subtitle="Entre com sua conta para acompanhar escalas, ensaios e repertórios do ministério."
            ctaHref="/login"
            ctaLabel="Entrar"
          />
        }
      >
        <div className="flex flex-col">
          <div className="mb-7">
            <AuthBadge size={88} />
          </div>

          <p className="af-label mb-3" style={{ color: "#f2c14e" }}>
            Novo Membro
          </p>
          <h1 className="mb-4 font-serif text-5xl font-black leading-[1.02] af-text">
            Criar conta
          </h1>
          <p className="mb-8 max-w-md text-[15px] font-semibold leading-relaxed af-muted">
            Cadastre seus dados ministeriais para participar das escalas e repertórios.
          </p>

          <form action={formAction} className="flex flex-col gap-5">
            <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
              <AuthField
                label="Nome"
                name="nome"
                type="text"
                placeholder="Nome completo"
                autoComplete="name"
                required
                hint="Use seu nome completo, sem números."
              />
              <AuthField
                label="E-mail"
                name="email"
                type="email"
                placeholder="nome.sobrenome@email.com"
                autoComplete="email"
                required
                hint="Use um e-mail real, com pelo menos 5 caracteres antes do @."
              />
              <AuthField
                label="Senha"
                name="senha"
                type="password"
                placeholder="Mínimo de 8 caracteres"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <AuthField
                label="Telefone"
                name="telefone"
                type="tel"
                placeholder="(11) 98552-0784"
                inputMode="tel"
                maxLength={15}
                autoComplete="tel-national"
                required
                hint="DDD + número, com 11 dígitos."
              />
            </div>

            {state?.error && <FormAlert>{state.error}</FormAlert>}

            <div className="mt-2">
              <PrimaryButton disabled={pending}>
                {pending ? "Criando conta..." : "Cadastrar"}
              </PrimaryButton>
            </div>
          </form>

          <div className="mt-4">
            <GhostUnderlineLink href="/login">Entrar</GhostUnderlineLink>
          </div>

          <p className="mt-5 text-center text-xs font-semibold leading-relaxed af-muted">
            Ao criar conta, você concorda com os{" "}
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

          <div className="mt-6 flex justify-center">
            <GhostPillLink href="/login">Entrar</GhostPillLink>
          </div>

          <form action={loginComGoogleAction} className="mt-3 flex justify-center">
            <input type="hidden" name="next" value="/dashboard" />
            <button type="submit" className="af-btn-pill">
              Cadastrar com Google
            </button>
          </form>
        </div>
      </AuthCard>

      <AuthMiniFooter />
    </AuthShell>
  );
}
