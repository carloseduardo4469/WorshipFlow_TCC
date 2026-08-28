"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { invalidateDataCache } from "@/lib/db/cache";

export type ActionState = { error?: string } | null;

function readMusicaIds(formData: FormData): number[] {
  return formData.getAll("musicaIds").map((v) => Number(v));
}

export async function criarRepertorioAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const ministerioIdRaw = String(formData.get("ministerioId") ?? "").trim();
  const musicaIds = readMusicaIds(formData);

  if (!nome) return { error: "Informe o nome do repertório." };

  const repos = await getRepositories();
  const repertorio = await repos.repertorios.create({
    nome,
    descricao: descricao || null,
    ministerioId: ministerioIdRaw ? Number(ministerioIdRaw) : null,
  });
  await repos.repertorios.setMusicas(repertorio.id, musicaIds);

  invalidateDataCache("repertorios");
  revalidatePath("/dashboard/historico");
  revalidatePath("/dashboard");
  redirect("/dashboard/historico");
}

export async function atualizarRepertorioAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const ministerioIdRaw = String(formData.get("ministerioId") ?? "").trim();
  const musicaIds = readMusicaIds(formData);

  if (!nome) return { error: "Informe o nome do repertório." };

  const repos = await getRepositories();
  await repos.repertorios.update(id, {
    nome,
    descricao: descricao || null,
    ministerioId: ministerioIdRaw ? Number(ministerioIdRaw) : null,
  });
  await repos.repertorios.setMusicas(id, musicaIds);

  invalidateDataCache("repertorios");
  revalidatePath("/dashboard/historico");
  revalidatePath("/dashboard");
  redirect("/dashboard/historico");
}

export async function removerRepertorioAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));

  const repos = await getRepositories();
  await repos.repertorios.remove(id);

  invalidateDataCache("repertorios");
  revalidatePath("/dashboard/historico");
  revalidatePath("/dashboard");
}
