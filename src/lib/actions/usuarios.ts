"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { invalidateDataCache } from "@/lib/db/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PerfilUsuario, StatusMinisterio } from "@/types/domain";

export type ActionState = { error?: string; success?: boolean } | null;

export async function atualizarPerfilAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireAuth();

  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const fotoPerfil = formData.get("fotoPerfil");
  const habilidades = formData
    .getAll("habilidades")
    .map((habilidade) => String(habilidade).trim())
    .filter(Boolean);

  if (!nome) return { error: "Informe seu nome." };

  let fotoPerfilUrl: string | undefined;
  if (fotoPerfil instanceof File && fotoPerfil.size > 0) {
    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
    const tamanhoMaximo = 1 * 1024 * 1024;

    if (!tiposPermitidos.includes(fotoPerfil.type)) {
      return { error: "Use uma imagem JPG, PNG ou WebP." };
    }
    if (fotoPerfil.size > tamanhoMaximo) {
      return { error: "A foto deve ter no máximo 1 MB." };
    }

    const bytes = Buffer.from(await fotoPerfil.arrayBuffer());
    fotoPerfilUrl = `data:${fotoPerfil.type};base64,${bytes.toString("base64")}`;
  }

  const repos = await getRepositories();
  await repos.usuarios.update(profile.id, {
    nome,
    telefone: telefone || null,
    // A interface trabalha apenas com a seleção de instrumentos. Mantemos
    // o primeiro item também no campo legado para compatibilidade dos dados.
    instrumentoPrincipal: habilidades[0] ?? null,
    habilidades: habilidades.length ? habilidades.join(",") : null,
    ...(fotoPerfilUrl ? { fotoPerfilUrl } : {}),
  });

  invalidateDataCache("usuarios");
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function atualizarUsuarioAdminAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const current = await requireAdmin();

  const id = String(formData.get("id"));
  const perfil = String(formData.get("perfil")) as PerfilUsuario;
  const statusMinisterio = String(formData.get("statusMinisterio")) as StatusMinisterio;
  const isSuspended = formData.get("isSuspended") === "true";
  const ministerioIdRaw = String(formData.get("ministerioId") ?? "").trim();

  const repos = await getRepositories();
  if (id === current.authId && isSuspended) {
    return { error: "Você não pode suspender a própria conta." };
  }
  await repos.usuarios.update(id, {
    perfil,
    statusMinisterio,
    isSuspended,
    ministerioId: ministerioIdRaw ? Number(ministerioIdRaw) : null,
  });

  invalidateDataCache("usuarios");
  revalidatePath("/dashboard/usuarios");
  revalidatePath("/dashboard/equipe");
  revalidatePath("/dashboard/admin/usuarios");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function excluirMinhaContaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { authId } = await requireAuth();
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();

  if (confirmacao !== "excluirminhaconta") {
    return { error: 'Digite "excluirminhaconta" para confirmar.' };
  }

  try {
    const repos = await getRepositories();
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(authId);
    if (error) throw error;

    // No Supabase o profile é removido pelo ON DELETE CASCADE; no backend
    // local precisamos remover o registro explicitamente.
    if (repos.backend === "local") await repos.usuarios.remove(authId);
  } catch {
    return { error: "Não foi possível excluir a conta. Tente novamente." };
  }

  invalidateDataCache("usuarios");
  revalidatePath("/dashboard", "layout");
  redirect("/login?account=deleted");
}
