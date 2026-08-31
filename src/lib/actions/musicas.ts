"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { invalidateDataCache } from "@/lib/db/cache";
import { gerarLinkCifraClub, resolverTomOriginal } from "@/lib/music/cifraclub";
import { TONALIDADE_INVALIDA_MESSAGE, isTonalidadeValida } from "@/lib/music/tonalidades";
import type { Musica } from "@/types/domain";

export type ActionState = { error?: string } | null;

export type BuscarMusicasInput = {
  busca: string;
  offset: number;
  limit: number;
  campo?: "titulo" | "artista" | "tonalidade";
};

/** Busca paginada de músicas para listas e seletores com rolagem infinita. */
export async function buscarMusicas(input: BuscarMusicasInput): Promise<Musica[]> {
  await requireAuth();
  const repos = await getRepositories();
  return repos.musicas.search({
    busca: input.busca,
    campo: input.campo,
    offset: Math.max(0, Math.floor(input.offset)),
    limit: Math.min(100, Math.max(1, Math.floor(input.limit))),
  });
}

/** Retorna as músicas já vinculadas (ids) para exibir como chips no seletor. */
export async function buscarMusicasPorIds(ids: number[]): Promise<Musica[]> {
  await requireAuth();
  const idsLimpos = [...new Set(ids)].filter((id) => Number.isInteger(id));
  if (idsLimpos.length === 0) return [];
  const repos = await getRepositories();
  return repos.musicas.getByIds(idsLimpos);
}

async function readMusicaForm(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const artista = String(formData.get("artista") ?? "").trim();
  const tonalidade = String(formData.get("tonalidade") ?? "").trim();
  const ministerioIdRaw = String(formData.get("ministerioId") ?? "").trim();

  // Detecta o tom original no CifraClub para abrir a cifra na relativa menor
  // quando a música é de tom menor (funciona para qualquer música).
  const tomOriginal = tonalidade ? await resolverTomOriginal({ titulo, artista }) : null;
  const linkCifra = gerarLinkCifraClub({
    titulo,
    artista: artista || null,
    tonalidade: tonalidade || null,
    tomOriginal,
  });

  return {
    titulo,
    artista: artista || null,
    tonalidade: tonalidade || null,
    linkCifra,
    ministerioId: ministerioIdRaw ? Number(ministerioIdRaw) : null,
  };
}

export async function criarMusicaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAuth();
  const data = await readMusicaForm(formData);
  if (!data.titulo) return { error: "Informe o título da música." };
  if (!data.artista) return { error: "Informe o artista para gerar a cifra automaticamente." };
  if (data.tonalidade && !isTonalidadeValida(data.tonalidade)) return { error: TONALIDADE_INVALIDA_MESSAGE };
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
  await requireAuth();
  const id = Number(formData.get("id"));
  const data = await readMusicaForm(formData);
  if (!data.titulo) return { error: "Informe o título da música." };
  if (!data.artista) return { error: "Informe o artista para gerar a cifra automaticamente." };
  if (data.tonalidade && !isTonalidadeValida(data.tonalidade)) return { error: TONALIDADE_INVALIDA_MESSAGE };
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
