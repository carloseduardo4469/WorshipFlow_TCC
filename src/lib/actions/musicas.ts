"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";

export type ActionState = { error?: string } | null;

function readMusicaForm(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const artista = String(formData.get("artista") ?? "").trim();
  const tonalidade = String(formData.get("tonalidade") ?? "").trim();
  const bpmRaw = String(formData.get("bpm") ?? "").trim();
  const linkCifra = String(formData.get("linkCifra") ?? "").trim();
  const ministerioIdRaw = String(formData.get("ministerioId") ?? "").trim();

  return {
    titulo,
    artista: artista || null,
    tonalidade: tonalidade || null,
    bpm: bpmRaw ? Number(bpmRaw) : null,
    linkCifra: linkCifra || null,
    ministerioId: ministerioIdRaw ? Number(ministerioIdRaw) : null,
  };
}

export async function criarMusicaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const data = readMusicaForm(formData);
  if (!data.titulo) return { error: "Informe o título da música." };

  const repos = await getRepositories();
  await repos.musicas.create(data);

  revalidatePath("/dashboard/musicas");
  redirect("/dashboard/musicas");
}

export async function atualizarMusicaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const data = readMusicaForm(formData);
  if (!data.titulo) return { error: "Informe o título da música." };

  const repos = await getRepositories();
  await repos.musicas.update(id, data);

  revalidatePath("/dashboard/musicas");
  redirect("/dashboard/musicas");
}

export async function removerMusicaAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));

  const repos = await getRepositories();
  await repos.musicas.remove(id);

  revalidatePath("/dashboard/musicas");
}
