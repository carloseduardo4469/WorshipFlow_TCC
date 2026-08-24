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

  const bpm = bpmRaw ? Number(bpmRaw) : null;
  const linkValido = !linkCifra || (() => {
    try { const url = new URL(linkCifra); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
  })();

  return {
    titulo,
    artista: artista || null,
    tonalidade: tonalidade || null,
    bpm,
    linkCifra: linkCifra || null,
    ministerioId: ministerioIdRaw ? Number(ministerioIdRaw) : null,
    linkValido,
  };
}

export async function criarMusicaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const data = readMusicaForm(formData);
  if (!data.titulo) return { error: "Informe o título da música." };
  if (data.bpm !== null && (!Number.isInteger(data.bpm) || data.bpm < 1 || data.bpm > 400)) return { error: "Informe um BPM entre 1 e 400." };
  if (!data.linkValido) return { error: "Informe um link válido começando com http:// ou https://." };

  const repos = await getRepositories();
  const { linkValido: _linkValido, ...musica } = data;
  await repos.musicas.create(musica);

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
  if (data.bpm !== null && (!Number.isInteger(data.bpm) || data.bpm < 1 || data.bpm > 400)) return { error: "Informe um BPM entre 1 e 400." };
  if (!data.linkValido) return { error: "Informe um link válido começando com http:// ou https://." };

  const repos = await getRepositories();
  const { linkValido: _linkValido, ...musica } = data;
  await repos.musicas.update(id, musica);

  revalidatePath("/dashboard/musicas");
  revalidatePath("/dashboard");
  redirect("/dashboard/musicas");
}

export async function removerMusicaAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));

  const repos = await getRepositories();
  await repos.musicas.remove(id);

  revalidatePath("/dashboard/musicas");
  revalidatePath("/dashboard");
}
