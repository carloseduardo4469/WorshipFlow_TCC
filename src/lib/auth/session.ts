import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRepositories } from "@/lib/db/repositories";
import type { Usuario } from "@/types/domain";

export interface CurrentUser {
  authId: string;
  email: string;
  profile: Usuario;
}

// Memoizado por request com cache() do React: o layout E a página chamam
// requireAuth()/getCurrentUser() na mesma request — sem memoização, cada
// navegação faria duas chamadas ao Auth do Supabase e duas queries de profile.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const authId = typeof claims?.sub === "string" ? claims.sub : null;
  if (!claims || !authId) return null;

  const email = typeof claims.email === "string" ? claims.email : "";
  const metadata = claims.user_metadata && typeof claims.user_metadata === "object"
    ? claims.user_metadata as Record<string, unknown>
    : {};

  const repos = await getRepositories();
  // O status de acesso precisa ser consultado em toda request para que uma
  // aprovacao ou suspensao administrativa tenha efeito imediatamente.
  let profile = await repos.usuarios.getById(authId);

  // Modo local: o trigger que cria o profile automaticamente só existe no
  // Postgres do Supabase. Se caiu pro SQLite e o profile ainda não existe
  // (ex.: usuário logado via Supabase Auth antes da queda), cria na hora.
  if (!profile && repos.backend === "local") {
    profile = await repos.usuarios.createLocal({
      id: authId,
      nome: typeof metadata.nome === "string" ? metadata.nome : email.split("@")[0] || "Usuário",
      email,
      telefone: typeof metadata.telefone === "string" ? metadata.telefone : null,
      instrumentoPrincipal: null,
      habilidades: null,
      statusAcesso: "PENDENTE",
      isSuspended: false,
      perfil: "MEMBRO",
      fotoPerfilUrl: null,
      ultimaAtividade: null,
    });
  }

  if (!profile) return null;

  return { authId, email: email || profile.email, profile };
});

/** Garante sessão; redireciona pro login se não houver. Use em páginas server. */
export async function requireAuth(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.profile.statusAcesso !== "ATIVO") {
    redirect("/aguardando-aprovacao");
  }
  if (current.profile.isSuspended) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login?error=suspended");
  }
  return current;
}

/** Garante sessão + perfil ADMIN; redireciona pro dashboard se for MEMBRO. */
export async function requireAdmin(): Promise<CurrentUser> {
  const current = await requireAuth();
  if (current.profile.perfil !== "ADMIN") redirect("/dashboard");
  return current;
}
