"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { invalidateDataCache } from "@/lib/db/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { gerarLinkCifraClub, resolverTomOriginal } from "@/lib/music/cifraclub";
import { TONALIDADE_INVALIDA_MESSAGE, isTonalidadeValida } from "@/lib/music/tonalidades";
import type { Musica } from "@/types/domain";
import { FORM_LIMITS, validateMaxLength } from "@/lib/validation/forms";

export type ActionState = { error?: string; success?: boolean; musica?: Musica } | null;

export type BuscarMusicasInput = {
  busca: string;
  offset: number;
  limit: number;
  campo?: "titulo" | "artista" | "tonalidade";
};

/** Busca paginada de músicas para listas e seletores com rolagem infinita. */
export async function buscarMusicas(input: BuscarMusicasInput): Promise<Musica[]> {
  await requireAuth();
  const busca = String(input?.busca ?? "").trim();
  if (busca.length > FORM_LIMITS.busca) throw new Error("Busca muito longa.");
  const offset = Number.isFinite(input?.offset) ? Math.max(0, Math.floor(input.offset)) : 0;
  const limit = Number.isFinite(input?.limit) ? Math.min(100, Math.max(1, Math.floor(input.limit))) : 20;
  const campo = (["titulo", "artista", "tonalidade"] as const).includes(input?.campo as never)
    ? input.campo
    : undefined;
  const repos = await getRepositories();
  return repos.musicas.search({
    busca,
    campo,
    offset,
    limit,
  });
}

/** Retorna as músicas já vinculadas (ids) para exibir como chips no seletor. */
export async function buscarMusicasPorIds(ids: number[]): Promise<Musica[]> {
  await requireAuth();
  const idsLimpos = [...new Set(Array.isArray(ids) ? ids : [])]
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, FORM_LIMITS.selecoes);
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

async function criarMusicaAutorizada(
  data: Awaited<ReturnType<typeof readMusicaForm>>,
  ministerioDoPerfil: number | null
): Promise<Musica> {
  const repos = await getRepositories();
  if (repos.backend === "local") {
    return repos.musicas.create({ ...data, ministerioId: ministerioDoPerfil });
  }

  // A ação já autenticou e validou o usuário. A gravação privilegiada evita
  // que uma política RLS desatualizada impeça membros autorizados de cadastrar
  // repertório pelo celular.
  const admin = createAdminClient();
  let ministerioId = ministerioDoPerfil;
  if (ministerioId === null) {
    const { data: ministerio, error: ministerioError } = await admin
      .from("ministerios")
      .select("id")
      .eq("ativo", true)
      .order("id")
      .limit(1)
      .maybeSingle();
    if (ministerioError) throw ministerioError;
    ministerioId = ministerio?.id ?? null;
  }

  const { data: row, error } = await admin
    .from("musicas")
    .insert({
      titulo: data.titulo,
      artista: data.artista,
      tonalidade: data.tonalidade,
      link_cifra: data.linkCifra,
      ministerio_id: ministerioId,
    })
    .select("*")
    .single();
  if (error) throw error;

  return {
    id: row.id,
    titulo: row.titulo,
    artista: row.artista ?? null,
    tonalidade: row.tonalidade ?? null,
    linkCifra: row.link_cifra ?? null,
    ministerioId: row.ministerio_id ?? null,
    createdAt: row.created_at,
  };
}

/** Cria uma música sem redirecionar, para uso dentro do modal de uma escala. */
export async function criarMusicaNaEscalaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireAuth();
  const tituloError = validateMaxLength(String(formData.get("titulo") ?? "").trim(), FORM_LIMITS.musicaTitulo, "Título");
  if (tituloError) return { error: tituloError };
  const artistaError = validateMaxLength(String(formData.get("artista") ?? "").trim(), FORM_LIMITS.artista, "Artista");
  if (artistaError) return { error: artistaError };
  const data = await readMusicaForm(formData);
  if (!data.titulo) return { error: "Informe o título da música." };
  if (!data.artista) return { error: "Informe o artista para gerar a cifra automaticamente." };
  if (!data.tonalidade) return { error: "Escolha uma tonalidade para a música." };
  if (!isTonalidadeValida(data.tonalidade)) return { error: TONALIDADE_INVALIDA_MESSAGE };

  let musica: Musica;
  try {
    musica = await criarMusicaAutorizada(data, profile.ministerioId);
  } catch (error) {
    console.error("Falha ao cadastrar música na escala:", error);
    return { error: "Não foi possível salvar a música. Tente novamente." };
  }
  invalidateDataCache("musicas");
  revalidatePath("/dashboard/musicas");
  revalidatePath("/dashboard");
  return { success: true, musica };
}

export async function criarMusicaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireAuth();
  const tituloError = validateMaxLength(String(formData.get("titulo") ?? "").trim(), FORM_LIMITS.musicaTitulo, "Título");
  if (tituloError) return { error: tituloError };
  const artistaError = validateMaxLength(String(formData.get("artista") ?? "").trim(), FORM_LIMITS.artista, "Artista");
  if (artistaError) return { error: artistaError };
  const data = await readMusicaForm(formData);
  if (!data.titulo) return { error: "Informe o título da música." };
  if (!data.artista) return { error: "Informe o artista para gerar a cifra automaticamente." };
  if (!data.tonalidade) return { error: "Escolha uma tonalidade para a música." };
  if (!isTonalidadeValida(data.tonalidade)) return { error: TONALIDADE_INVALIDA_MESSAGE };
  if (data.ministerioId !== null && (!Number.isInteger(data.ministerioId) || data.ministerioId <= 0)) {
    return { error: "Ministério inválido." };
  }
  try {
    await criarMusicaAutorizada(data, data.ministerioId ?? profile.ministerioId);
  } catch (error) {
    console.error("Falha ao cadastrar música:", error);
    return { error: "Não foi possível salvar a música. Tente novamente." };
  }

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
  if (!Number.isInteger(id) || id <= 0) return { error: "Música inválida." };
  const tituloError = validateMaxLength(String(formData.get("titulo") ?? "").trim(), FORM_LIMITS.musicaTitulo, "Título");
  if (tituloError) return { error: tituloError };
  const artistaError = validateMaxLength(String(formData.get("artista") ?? "").trim(), FORM_LIMITS.artista, "Artista");
  if (artistaError) return { error: artistaError };
  const data = await readMusicaForm(formData);
  if (!data.titulo) return { error: "Informe o título da música." };
  if (!data.artista) return { error: "Informe o artista para gerar a cifra automaticamente." };
  if (!data.tonalidade) return { error: "Escolha uma tonalidade para a música." };
  if (!isTonalidadeValida(data.tonalidade)) return { error: TONALIDADE_INVALIDA_MESSAGE };
  try {
    const repos = await getRepositories();
    const { ministerioId: _ministerioId, ...musica } = data;
    await repos.musicas.update(id, musica);
  } catch {
    return { error: "Não foi possível salvar as alterações da música. Tente novamente." };
  }

  invalidateDataCache("musicas");
  revalidatePath("/dashboard/musicas");
  revalidatePath("/dashboard");
  redirect("/dashboard/musicas");
}

export async function removerMusicaAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Música inválida.");

  const repos = await getRepositories();
  await repos.musicas.remove(id);

  invalidateDataCache("musicas");
  revalidatePath("/dashboard/musicas");
  revalidatePath("/dashboard");
}
