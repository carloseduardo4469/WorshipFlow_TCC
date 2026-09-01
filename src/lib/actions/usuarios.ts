"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { invalidateDataCache } from "@/lib/db/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PerfilUsuario, Usuario } from "@/types/domain";
import {
  FORM_LIMITS,
  normalizePersonName,
  normalizePhone,
  validatePersonName,
  validatePhone,
} from "@/lib/validation/forms";

export type ActionState = { error?: string; success?: boolean } | null;

const PROFILE_PHOTOS_BUCKET = "profile-photos";

async function uploadProfilePhoto(userId: string, ministerioId: number | null, file: File) {
  const admin = createAdminClient();
  const { data: bucket } = await admin.storage.getBucket(PROFILE_PHOTOS_BUCKET);
  if (!bucket) {
    const { error: createError } = await admin.storage.createBucket(PROFILE_PHOTOS_BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (createError && !createError.message.toLowerCase().includes("already exists")) throw createError;
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const objectPath = `${ministerioId ?? "sem-ministerio"}/${userId}/avatar.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .upload(objectPath, bytes, { contentType: file.type, cacheControl: "31536000", upsert: true });
  if (uploadError) throw uploadError;

  const { data } = admin.storage.from(PROFILE_PHOTOS_BUCKET).getPublicUrl(objectPath);
  return `${data.publicUrl}?v=${Date.now()}`;
}

/** Registra a última atividade do usuário logado (heartbeat de presença). */
export async function registrarAtividade(): Promise<void> {
  const { profile } = await requireAuth();
  const repos = await getRepositories();
  await repos.usuarios.update(profile.id, {
    ultimaAtividade: new Date().toISOString(),
  });
}

/** Lista os usuários com presença fresca (sem cache) para a equipe. */
export async function listarUsuariosComPresenca(): Promise<Array<Pick<Usuario, "id" | "ultimaAtividade">>> {
  const { profile } = await requireAuth();
  const repos = await getRepositories();
  const usuarios = await repos.usuarios.list(profile.ministerioId ?? -1);
  return usuarios.map(({ id, ultimaAtividade }) => ({ id, ultimaAtividade }));
}

/** Busca uma página de usuários para seletores roláveis, sem carregar a tabela inteira. */
export async function buscarUsuarios(offset: number, limit: number): Promise<Usuario[]> {
  const { profile } = await requireAuth();
  const offsetSeguro = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;
  const limiteSeguro = Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.floor(limit))) : 20;
  const repos = await getRepositories();
  return repos.usuarios.search({ offset: offsetSeguro, limit: limiteSeguro, ministerioId: profile.ministerioId ?? -1 });
}

export async function buscarUsuariosPorIds(ids: string[]): Promise<Usuario[]> {
  const { profile } = await requireAuth();
  if (profile.ministerioId === null) return [];
  const idsLimpos = [...new Set(Array.isArray(ids) ? ids.map(String).filter(Boolean) : [])]
    .slice(0, FORM_LIMITS.selecoes);
  if (idsLimpos.length === 0) return [];
  const repos = await getRepositories();
  const usuarios = await repos.usuarios.getByIds(idsLimpos);
  return usuarios.filter((usuario) => usuario.ministerioId === profile.ministerioId);
}

export async function atualizarPerfilAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireAuth();

  const nomeRaw = String(formData.get("nome") ?? "");
  const nome = normalizePersonName(nomeRaw).trim();
  const telefoneRaw = String(formData.get("telefone") ?? "").trim();
  const telefone = normalizePhone(telefoneRaw);
  const fotoPerfil = formData.get("fotoPerfil");
  const habilidades = formData
    .getAll("habilidades")
    .map((habilidade) => String(habilidade).trim())
    .filter(Boolean);

  const nomeError = validatePersonName(nomeRaw);
  if (nomeError) return { error: nomeError };
  const telefoneError = validatePhone(telefoneRaw);
  if (telefoneError) return { error: telefoneError };

  const habilidadesPermitidas = new Set([
    "violao", "guitarra", "bateria", "teclado", "baixo", "voz-principal", "voz-secundaria",
  ]);
  if (habilidades.length > 7 || habilidades.some((habilidade) => !habilidadesPermitidas.has(habilidade))) {
    return { error: "Seleção de instrumentos inválida." };
  }

  let fotoPerfilUrl: string | undefined;
  const repos = await getRepositories();
  if (fotoPerfil instanceof File && fotoPerfil.size > 0) {
    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
    const tamanhoMaximo = 5 * 1024 * 1024;

    if (!tiposPermitidos.includes(fotoPerfil.type)) {
      return { error: "Use uma imagem JPG, PNG ou WebP." };
    }
    if (fotoPerfil.size > tamanhoMaximo) {
      return { error: "A foto deve ter no máximo 5 MB." };
    }

    try {
      if (repos.backend === "supabase") {
        fotoPerfilUrl = await uploadProfilePhoto(profile.id, profile.ministerioId, fotoPerfil);
      } else {
        const bytes = Buffer.from(await fotoPerfil.arrayBuffer());
        fotoPerfilUrl = `data:${fotoPerfil.type};base64,${bytes.toString("base64")}`;
      }
    } catch (error) {
      console.error("Falha ao armazenar foto de perfil:", error);
      return { error: "Não foi possível enviar a foto. Tente novamente com outra imagem." };
    }
  }

  try {
    await repos.usuarios.update(profile.id, {
    nome,
    telefone: telefone || null,
    // A interface trabalha apenas com a seleção de instrumentos. Mantemos
    // o primeiro item também no campo legado para compatibilidade dos dados.
    instrumentoPrincipal: habilidades[0] ?? null,
    habilidades: habilidades.length ? habilidades.join(",") : null,
    ...(fotoPerfilUrl ? { fotoPerfilUrl } : {}),
    });
  } catch {
    return { error: "Não foi possível salvar o perfil. Tente novamente." };
  }

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
  const isSuspended = formData.get("isSuspended") === "true";

  if (!id) return { error: "Usuário inválido." };
  if (!(["MEMBRO", "ADMIN"] as string[]).includes(perfil)) return { error: "Perfil inválido." };

  const repos = await getRepositories();
  if (id === current.authId && isSuspended) {
    return { error: "Você não pode suspender a própria conta." };
  }
  const usuario = await repos.usuarios.getById(id);
  if (!usuario || current.profile.ministerioId === null || usuario.ministerioId !== current.profile.ministerioId) {
    return { error: "Usuário não encontrado neste ministério." };
  }
  try {
    await repos.usuarios.update(id, {
      perfil,
      isSuspended,
    });
  } catch (error) {
    console.error("Falha ao atualizar usuário:", error);
    return { error: "Não foi possível atualizar o usuário. Tente novamente." };
  }

  invalidateDataCache("usuarios");
  revalidatePath("/dashboard/usuarios");
  revalidatePath("/dashboard/equipe");
  revalidatePath("/dashboard/admin/usuarios");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function removerUsuarioAdminAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const current = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) return { error: "Usuário inválido." };
  if (id === current.authId) {
    return { error: "Você não pode remover a própria conta por esta tela." };
  }

  try {
    const repos = await getRepositories();
    const usuario = await repos.usuarios.getById(id);

    if (!usuario) return { error: "Usuário não encontrado." };
    if (current.profile.ministerioId === null || usuario.ministerioId !== current.profile.ministerioId) {
      return { error: "Usuário não encontrado neste ministério." };
    }
    if (usuario.perfil === "ADMIN") {
      return { error: "Administradores não podem ser removidos por esta tela." };
    }

    if (repos.backend === "supabase") {
      const admin = createAdminClient();
      const { error: authError } = await admin.auth.admin.deleteUser(id);
      if (authError) throw authError;

      // A FK normalmente remove o profile em cascata. Esta operação também
      // cobre instalações antigas nas quais a cascata ainda não foi aplicada.
      const { error: profileError } = await admin.from("profiles").delete().eq("id", id);
      if (profileError) throw profileError;
    } else {
      await repos.usuarios.remove(id);
    }
  } catch {
    return { error: "Não foi possível remover o usuário. Tente novamente." };
  }

  invalidateDataCache("usuarios");
  revalidatePath("/dashboard/usuarios");
  revalidatePath("/dashboard/equipe");
  revalidatePath("/dashboard/admin/usuarios");
  revalidatePath("/dashboard/escalas");
  revalidatePath("/dashboard/historico");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function excluirMinhaContaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { authId } = await requireAuth();
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();

  if (confirmacao.length > FORM_LIMITS.confirmacaoExclusao) {
    return { error: "Confirmação inválida." };
  }

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
