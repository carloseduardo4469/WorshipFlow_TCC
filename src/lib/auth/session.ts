import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRepositories } from "@/lib/db/repositories";
import type { Usuario } from "@/types/domain";

export interface CurrentUser {
  authId: string;
  email: string;
  profile: Usuario;
}

/** Retorna o usuário logado + profile, ou null se não houver sessão. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const repos = await getRepositories();
  let profile = await repos.usuarios.getById(user.id);

  // Modo local: o trigger que cria o profile automaticamente só existe no
  // Postgres do Supabase. Se caiu pro SQLite e o profile ainda não existe
  // (ex.: usuário logado via Supabase Auth antes da queda), cria na hora.
  if (!profile && repos.backend === "local") {
    profile = await repos.usuarios.createLocal({
      id: user.id,
      nome: user.user_metadata?.nome ?? user.email?.split("@")[0] ?? "Usuário",
      email: user.email ?? "",
      telefone: null,
      instrumentoPrincipal: null,
      habilidades: null,
      statusMinisterio: "ATIVO",
      perfil: "MEMBRO",
      fotoPerfilUrl: null,
      ministerioId: null,
    });
  }

  if (!profile) return null;

  return { authId: user.id, email: user.email ?? profile.email, profile };
}

/** Garante sessão; redireciona pro login se não houver. Use em páginas server. */
export async function requireAuth(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  return current;
}

/** Garante sessão + perfil ADMIN; redireciona pro dashboard se for MEMBRO. */
export async function requireAdmin(): Promise<CurrentUser> {
  const current = await requireAuth();
  if (current.profile.perfil !== "ADMIN") redirect("/dashboard");
  return current;
}
