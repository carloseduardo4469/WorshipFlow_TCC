"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { invalidateDataCache } from "@/lib/db/cache";
import { gerarLinkCifraClub } from "@/lib/music/cifraclub";
import { TONALIDADE_INVALIDA_MESSAGE, isTonalidadeValida } from "@/lib/music/tonalidades";

export type ActionState = { error?: string } | null;

function readMusicaForm(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const artista = String(formData.get("artista") ?? "").trim();
  const tonalidade = String(formData.get("tonalidade") ?? "").trim();
  const bpmRaw = String(formData.get("bpm") ?? "").trim();
  const ministerioIdRaw = String(formData.get("ministerioId") ?? "").trim();

  const bpm = bpmRaw ? Number(bpmRaw) : null;
  const linkCifra = gerarLinkCifraClub({
    titulo,
    artista: artista || null,
    tonalidade: tonalidade || null,
  });

  return {
    titulo,
    artista: artista || null,
    tonalidade: tonalidade || null,
    bpm,
    linkCifra,
    ministerioId: ministerioIdRaw ? Number(ministerioIdRaw) : null,
  };
}

export async function criarMusicaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const data = readMusicaForm(formData);
  if (!data.titulo) return { error: "Informe o título da música." };
  if (!data.artista) return { error: "Informe o artista para gerar a cifra automaticamente." };
  if (data.tonalidade && !isTonalidadeValida(data.tonalidade)) return { error: TONALIDADE_INVALIDA_MESSAGE };
  if (data.bpm !== null && (!Number.isInteger(data.bpm) || data.bpm < 1 || data.bpm > 400)) return { error: "Informe um BPM entre 1 e 400." };
  const repos = await getRepositories();
  await repos.musicas.create(data);

  invalidateDataCache("musicas");
  revalidatePath("/dashboard/musicas");
  revalidatePath("/dashboard");
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
  if (!data.artista) return { error: "Informe o artista para gerar a cifra automaticamente." };
  if (data.tonalidade && !isTonalidadeValida(data.tonalidade)) return { error: TONALIDADE_INVALIDA_MESSAGE };
  if (data.bpm !== null && (!Number.isInteger(data.bpm) || data.bpm < 1 || data.bpm > 400)) return { error: "Informe um BPM entre 1 e 400." };
  const repos = await getRepositories();
  const { ministerioId: _ministerioId, ...musica } = data;
  await repos.musicas.update(id, musica);

  invalidateDataCache("musicas");
  revalidatePath("/dashboard/musicas");
  revalidatePath("/dashboard");
  redirect("/dashboard/musicas");
}

export async function removerMusicaAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));

  const repos = await getRepositories();
  await repos.musicas.remove(id);

  invalidateDataCache("musicas");
  revalidatePath("/dashboard/musicas");
  revalidatePath("/dashboard");
}
