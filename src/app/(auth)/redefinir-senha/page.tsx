import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FormAlert } from "@/components/ui/FormAlert";
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
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 font-display text-2xl font-bold text-paper">Nova senha</h1>
        <p className="mb-6 text-sm text-muted">Escolha uma nova senha para sua conta.</p>

        {user ? (
          <NovaSenhaForm />
        ) : (
          <div className="flex flex-col gap-6">
            <FormAlert>
              Este link de redefinição não é válido ou já expirou. Solicite um novo para continuar.
            </FormAlert>
            <Link href="/esqueci-senha" className="text-center text-sm text-amber hover:underline">
              Solicitar novo link
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
