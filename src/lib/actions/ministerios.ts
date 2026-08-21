"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";

export type ActionState = { error?: string } | null;

export async function criarMinisterioAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();

  if (!nome) return { error: "Informe o nome do ministério." };

  const repos = await getRepositories();
  await repos.ministerios.create({ nome, descricao: descricao || null, ativo: true });

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

  if (!nome) return { error: "Informe o nome do ministério." };

  const repos = await getRepositories();
  await repos.ministerios.update(id, { nome, descricao: descricao || null, ativo });

  revalidatePath("/dashboard/ministerios");
  revalidatePath("/dashboard");
  redirect("/dashboard/ministerios");
}

export async function removerMinisterioAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));

  const repos = await getRepositories();
  await repos.ministerios.remove(id);

  revalidatePath("/dashboard/ministerios");
  revalidatePath("/dashboard");
}
