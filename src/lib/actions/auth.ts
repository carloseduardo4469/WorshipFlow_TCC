"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string } | null;

async function getSiteUrl() {
  const h = await headers();
  const origin = h.get("origin");
  return origin ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !senha) return { error: "Preencha email e senha." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    return { error: "Email ou senha incorretos." };
  }

  // Limpa qualquer cache de navegação que possa ter sobrado de outra sessão.
  revalidatePath("/dashboard", "layout");
  redirect(next || "/dashboard");
}

export async function cadastroAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const confirmarSenha = String(formData.get("confirmarSenha") ?? "");

  if (!nome || !email || !senha) return { error: "Preencha todos os campos." };
  if (senha.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  if (senha !== confirmarSenha) return { error: "As senhas não coincidem." };

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Já existe uma conta com esse email." };
    }
    return { error: "Não foi possível criar a conta. Tente novamente." };
  }

  redirect("/login?cadastro=confirme-email");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Invalida o dashboard inteiro (rota + todas as filhas) no cliente e no
  // servidor, pra nunca servir página em cache da sessão anterior.
  revalidatePath("/dashboard", "layout");
  redirect("/login");
}

export async function esqueciSenhaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Informe seu email." };

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  // Não revelamos se o email existe ou não — sempre a mesma resposta.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/redefinir-senha`,
  });

  redirect("/login?reset=email-enviado");
}

export async function redefinirSenhaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const senha = String(formData.get("senha") ?? "");
  const confirmarSenha = String(formData.get("confirmarSenha") ?? "");

  if (senha.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  if (senha !== confirmarSenha) return { error: "As senhas não coincidem." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: senha });

  if (error) return { error: "Não foi possível redefinir a senha. O link pode ter expirado." };

  redirect("/login?reset=sucesso");
}

export async function loginComGoogleAction(formData: FormData) {
  const next = String(formData.get("next") ?? "/dashboard");
  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}
