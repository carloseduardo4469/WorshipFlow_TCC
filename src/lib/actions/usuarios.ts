"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import type { PerfilUsuario, StatusMinisterio } from "@/types/domain";

export type ActionState = { error?: string; success?: boolean } | null;

export async function atualizarPerfilAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireAuth();

  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const instrumentoPrincipal = String(formData.get("instrumentoPrincipal") ?? "").trim();
  const habilidades = String(formData.get("habilidades") ?? "").trim();

  if (!nome) return { error: "Informe seu nome." };

  const repos = await getRepositories();
  await repos.usuarios.update(profile.id, {
    nome,
    telefone: telefone || null,
    instrumentoPrincipal: instrumentoPrincipal || null,
    habilidades: habilidades || null,
  });

  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function atualizarUsuarioAdminAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id"));
  const perfil = String(formData.get("perfil")) as PerfilUsuario;
  const statusMinisterio = String(formData.get("statusMinisterio")) as StatusMinisterio;
  const ministerioIdRaw = String(formData.get("ministerioId") ?? "").trim();

  const repos = await getRepositories();
  await repos.usuarios.update(id, {
    perfil,
    statusMinisterio,
    ministerioId: ministerioIdRaw ? Number(ministerioIdRaw) : null,
  });

  revalidatePath("/dashboard/usuarios");
  revalidatePath("/dashboard");
  return { success: true };
}
