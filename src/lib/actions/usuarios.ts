"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { invalidateDataCache } from "@/lib/db/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PerfilUsuario, StatusMinisterio, Usuario } from "@/types/domain";
import {
  FORM_LIMITS,
  normalizePersonName,
  normalizePhone,
  validatePersonName,
  validatePhone,
} from "@/lib/validation/forms";

export type ActionState = { error?: string; success?: boolean } | null;

/** Registra a última atividade do usuário logado (heartbeat de presença). */
export async function registrarAtividade(): Promise<void> {
  const { profile } = await requireAuth();
  const repos = await getRepositories();
  await repos.usuarios.update(profile.id, {
    ultimaAtividade: new Date().toISOString(),
  });
}

/** Lista os usuários com presença fresca (sem cache) para a equipe. */
export async function listarUsuariosComPresenca(): Promise<Usuario[]> {
  await requireAuth();
  const repos = await getRepositories();
  return repos.usuarios.list();
}

/** Busca uma página de usuários para seletores roláveis, sem carregar a tabela inteira. */
export async function buscarUsuarios(offset: number, limit: number): Promise<Usuario[]> {
  await requireAuth();
  const offsetSeguro = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;
  const limiteSeguro = Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.floor(limit))) : 20;
  const repos = await getRepositories();
  return repos.usuarios.search({ offset: offsetSeguro, limit: limiteSeguro });
}

export async function buscarUsuariosPorIds(ids: string[]): Promise<Usuario[]> {
  await requireAuth();
  const idsLimpos = [...new Set(Array.isArray(ids) ? ids.map(String).filter(Boolean) : [])]
    .slice(0, FORM_LIMITS.selecoes);
  if (idsLimpos.length === 0) return [];
  const repos = await getRepositories();
  return repos.usuarios.getByIds(idsLimpos);
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

  if (!id) return { error: "Usuário inválido." };
  if (!(["MEMBRO", "ADMIN"] as string[]).includes(perfil)) return { error: "Perfil inválido." };
  if (!(["ATIVO", "INATIVO"] as string[]).includes(statusMinisterio)) return { error: "Status inválido." };
  const ministerioId = ministerioIdRaw ? Number(ministerioIdRaw) : null;
  if (ministerioId !== null && (!Number.isInteger(ministerioId) || ministerioId <= 0)) {
    return { error: "Ministério inválido." };
  }

  const repos = await getRepositories();
  if (id === current.authId && isSuspended) {
    return { error: "Você não pode suspender a própria conta." };
  }
  await repos.usuarios.update(id, {
    perfil,
    statusMinisterio,
    isSuspended,
    ministerioId,
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
