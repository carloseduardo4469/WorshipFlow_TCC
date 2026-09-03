"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { invalidateDataCache } from "@/lib/db/cache";
import {
  FORM_LIMITS,
  normalizePersonName,
  normalizePhone,
  validateMaxLength,
  validatePersonName,
  validatePhone,
} from "@/lib/validation/forms";

export type ActionState = { error?: string } | null;

async function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return new URL(configured).origin;

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) return new URL(`https://${vercelHost}`).origin;

  // Em desenvolvimento aceitamos apenas origens locais conhecidas. Nunca use
  // um Origin arbitrário para montar links enviados por email ou OAuth.
  const origin = (await headers()).get("origin");
  if (origin) {
    const parsed = new URL(origin);
    if (["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)) return parsed.origin;
  }
  return "http://localhost:3000";
}

/** Só aceita caminhos relativos internos ("/x"), bloqueando open redirect ("https://…", "//…"). */
function safeNextPath(value: string, fallback = "/dashboard"): string {
  const next = value.trim();
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return fallback;
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!email || !senha) return { error: "Preencha email e senha." };
  const emailLengthError = validateMaxLength(email, FORM_LIMITS.email, "Email");
  if (emailLengthError) return { error: emailLengthError };
  const senhaLengthError = validateMaxLength(senha, FORM_LIMITS.senha, "Senha");
  if (senhaLengthError) return { error: senhaLengthError };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    if (error.status === 429) {
      return { error: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente." };
    }
    return { error: "Email ou senha incorretos." };
  }

  // Limpa qualquer cache de navegação que possa ter sobrado de outra sessão.
  revalidatePath("/dashboard", "layout");
  redirect(next || "/dashboard");
}

export async function cadastroAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const nomeRaw = String(formData.get("nome") ?? "");
  const nome = normalizePersonName(nomeRaw).trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  // Telefone no formato (11) 98552-0784 → DDD + número, com 11 dígitos.
  const telefoneRaw = String(formData.get("telefone") ?? "").trim();
  const telefone = normalizePhone(telefoneRaw);

  if (!nome || !email || !senha) {
    return { error: "Preencha nome, email e senha." };
  }
  const nomeError = validatePersonName(nomeRaw);
  if (nomeError) return { error: nomeError };
  const emailLengthError = validateMaxLength(email, FORM_LIMITS.email, "Email");
  if (emailLengthError) return { error: emailLengthError };
  if (senha.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  const senhaLengthError = validateMaxLength(senha, FORM_LIMITS.senha, "Senha");
  if (senhaLengthError) return { error: senhaLengthError };
  const telefoneError = validatePhone(telefoneRaw);
  if (telefoneError) return { error: telefoneError };

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome, telefone: telefone || null },
      emailRedirectTo: `${siteUrl}/auth/callback?flow=signup`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Já existe uma conta com esse email." };
    }
    return { error: "Não foi possível criar a conta. Tente novamente." };
  }

  // O profile criado pelo trigger precisa entrar imediatamente nas listas de
  // equipe e nos seletores de membros das escalas.
  invalidateDataCache("usuarios");
  revalidatePath("/dashboard/equipe");
  revalidatePath("/dashboard/usuarios");
  revalidatePath("/dashboard/admin/usuarios");
  revalidatePath("/dashboard/admin/escalas");
  revalidatePath("/dashboard/admin/escalas/novo");
  revalidatePath("/dashboard/escalas/novo");

  // Projeto sem confirmação de email: o signUp já autentica o usuário. Nesse
  // caso vamos direto pro dashboard — mandar pro /login faria o proxy rebater
  // pro dashboard (usuário logado) sem mostrar mensagem nenhuma.
  if (data.session) {
    revalidatePath("/dashboard", "layout");
    redirect("/dashboard");
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
  const emailLengthError = validateMaxLength(email, FORM_LIMITS.email, "Email");
  if (emailLengthError) return { error: emailLengthError };

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  // Não revelamos se o email existe ou não — no caminho feliz a resposta é
  // sempre a mesma. Erro aqui só acontece com email malformado ou rate limit.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?flow=recovery&next=/redefinir-senha`,
  });

  if (error) {
    return { error: "Não foi possível enviar o link. Confira o email informado e tente novamente em instantes." };
  }

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

  const senhaLengthError = validateMaxLength(senha, FORM_LIMITS.senha, "Senha");
  if (senhaLengthError) return { error: senhaLengthError };
  const confirmacaoLengthError = validateMaxLength(confirmarSenha, FORM_LIMITS.senha, "Confirmação da senha");
  if (confirmacaoLengthError) return { error: confirmacaoLengthError };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: senha });

  if (error) {
    return { error: "Não foi possível redefinir a senha. O link pode ter expirado — solicite um novo na página \"Esqueci minha senha\"." };
  }

  // Encerra a sessão criada pelo link de recovery. Sem isso o usuário segue
  // logado e o proxy rebate o redirect pro /login de volta pro /dashboard —
  // a mensagem "senha redefinida" nunca apareceria.
  await supabase.auth.signOut();
  revalidatePath("/dashboard", "layout");

  redirect("/login?reset=sucesso");
}

export async function loginComGoogleAction(formData: FormData) {
  const next = safeNextPath(String(formData.get("next") ?? ""));
  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: { prompt: "select_account" },
      redirectTo: `${siteUrl}/auth/callback?flow=google&next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}
