"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { invalidateDataCache } from "@/lib/db/cache";
import { FORM_LIMITS, validateMaxLength } from "@/lib/validation/forms";

export type ActionState = { error?: string } | null;

function readMusicaIds(formData: FormData): number[] {
  return [...new Set(formData.getAll("musicaIds").map((v) => Number(v)))]
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, FORM_LIMITS.selecoes);
}

function validarTextos(nome: string, descricao: string): string | null {
  if (!nome) return "Informe o nome do repertório.";
  return validateMaxLength(nome, FORM_LIMITS.nomeGenerico, "Nome")
    ?? validateMaxLength(descricao, FORM_LIMITS.descricao, "Descrição");
}

function ministerioIdValido(value: string) {
  if (!value) return true;
  const id = Number(value);
  return Number.isInteger(id) && id > 0;
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

  const textoError = validarTextos(nome, descricao);
  if (textoError) return { error: textoError };
  if (!ministerioIdValido(ministerioIdRaw)) return { error: "Ministério inválido." };

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

  if (!Number.isInteger(id) || id <= 0) return { error: "Repertório inválido." };
  const textoError = validarTextos(nome, descricao);
  if (textoError) return { error: textoError };
  if (!ministerioIdValido(ministerioIdRaw)) return { error: "Ministério inválido." };

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
  if (!Number.isInteger(id) || id <= 0) throw new Error("Repertório inválido.");

  const repos = await getRepositories();
  await repos.repertorios.remove(id);

  invalidateDataCache("repertorios");
  revalidatePath("/dashboard/historico");
  revalidatePath("/dashboard");
}
