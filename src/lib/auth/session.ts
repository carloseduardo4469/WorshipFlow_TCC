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
  const repos = await getRepositories();

  // O desenvolvimento local é totalmente independente do Supabase. Mantém
  // um administrador fixo no SQLite para permitir testar todas as telas.
  if (process.env.NODE_ENV === "development" && repos.backend === "local") {
    const authId = "00000000-0000-4000-8000-000000000001";
    let profile = await repos.usuarios.getById(authId);
    if (!profile) {
      profile = await repos.usuarios.createLocal({
        id: authId,
        nome: "Administrador local",
        email: "admin@local.test",
        telefone: null,
        instrumentoPrincipal: null,
        habilidades: null,
        statusMinisterio: "ATIVO",
        isSuspended: false,
        perfil: "ADMIN",
        fotoPerfilUrl: null,
        ministerioId: null,
        ultimaAtividade: null,
      });
    }
    return { authId, email: profile.email, profile };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let profile = await repos.usuarios.getById(user.id);

  // Modo local: o trigger que cria o profile automaticamente só existe no
  // Postgres do Supabase. Se caiu pro SQLite e o profile ainda não existe
  // (ex.: usuário logado via Supabase Auth antes da queda), cria na hora.
  if (!profile && repos.backend === "local") {
    profile = await repos.usuarios.createLocal({
      id: user.id,
      nome: user.user_metadata?.nome ?? user.email?.split("@")[0] ?? "Usuário",
      email: user.email ?? "",
      telefone: user.user_metadata?.telefone ?? null,
      instrumentoPrincipal: null,
      habilidades: null,
      statusMinisterio: "ATIVO",
      isSuspended: false,
      perfil: "MEMBRO",
      fotoPerfilUrl: null,
      ministerioId: null,
      ultimaAtividade: null,
    });
  }

  if (!profile) return null;

  return { authId: user.id, email: user.email ?? profile.email, profile };
});

/** Garante sessão; redireciona pro login se não houver. Use em páginas server. */
export async function requireAuth(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
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
