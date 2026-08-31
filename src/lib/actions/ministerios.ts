"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { invalidateDataCache } from "@/lib/db/cache";
import { FORM_LIMITS, validateMaxLength } from "@/lib/validation/forms";

export type ActionState = { error?: string } | null;

export async function criarMinisterioAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();

  if (!nome) return { error: "Informe o nome do ministério." };
  const nomeError = validateMaxLength(nome, FORM_LIMITS.ministerioNome, "Nome");
  if (nomeError) return { error: nomeError };
  const descricaoError = validateMaxLength(descricao, FORM_LIMITS.descricao, "Descrição");
  if (descricaoError) return { error: descricaoError };

  const repos = await getRepositories();
  await repos.ministerios.create({ nome, descricao: descricao || null, ativo: true });

  invalidateDataCache("ministerios");
  revalidatePath("/dashboard/ministerios");
  revalidatePath("/dashboard");
  redirect("/dashboard/ministerios");
}

export async function atualizarMinisterioAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const ativo = formData.get("ativo") === "on";

  if (!Number.isInteger(id) || id <= 0) return { error: "Ministério inválido." };
  if (!nome) return { error: "Informe o nome do ministério." };
  const nomeError = validateMaxLength(nome, FORM_LIMITS.ministerioNome, "Nome");
  if (nomeError) return { error: nomeError };
  const descricaoError = validateMaxLength(descricao, FORM_LIMITS.descricao, "Descrição");
  if (descricaoError) return { error: descricaoError };

  const repos = await getRepositories();
  await repos.ministerios.update(id, { nome, descricao: descricao || null, ativo });

  invalidateDataCache("ministerios");
  revalidatePath("/dashboard/ministerios");
  revalidatePath("/dashboard");
  redirect("/dashboard/ministerios");
}

export async function removerMinisterioAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Ministério inválido.");

  const repos = await getRepositories();
  await repos.ministerios.remove(id);

  invalidateDataCache("ministerios");
  revalidatePath("/dashboard/ministerios");
  revalidatePath("/dashboard");
}
