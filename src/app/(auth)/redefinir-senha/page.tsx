import { createClient } from "@/lib/supabase/server";
import { FormAlert } from "@/components/ui/FormAlert";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { Showcase } from "@/components/auth/Showcase";
import { AuthBadge, GhostPillLink } from "@/components/auth/AuthUi";
import { NovaSenhaForm } from "./NovaSenhaForm";

// Página server: valida se a sessão do link de recovery existe ANTES de
// mostrar o formulário — sem isso o usuário só descobria que o link era
// inválido depois de preencher tudo e tomar um erro genérico no submit.
export default async function RedefinirSenhaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
            subtitle="Crie uma nova senha e volte a cuidar das escalas do ministério."
            ctaHref="/login"
            ctaLabel="Voltar para login"
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
            Nova senha
          </h1>
          <p className="mb-8 max-w-sm text-[15px] font-semibold leading-relaxed af-muted">
            Escolha uma nova senha para proteger sua conta.
          </p>

          {user ? (
            <NovaSenhaForm />
          ) : (
            <div className="flex flex-col gap-6">
              <FormAlert>
                Este link de redefinição não é válido ou já expirou. Solicite um novo para
                continuar.
              </FormAlert>
              <div className="flex justify-center">
                <GhostPillLink href="/esqueci-senha">Solicitar novo link</GhostPillLink>
              </div>
            </div>
          )}
        </div>
      </AuthCard>
    </AuthShell>
  );
}
