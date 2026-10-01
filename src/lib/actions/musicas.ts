"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireAdmin, requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { invalidateDataCache } from "@/lib/db/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { aplicarTonalidadeAoLinkCifra, gerarLinkCifraClub } from "@/lib/music/cifraclub";
import { resolverCifraValidada } from "@/lib/music/resolver-cifra";
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

  // Always try to discover a cifra when title+artist are present. If the
  // provided tonalidade isn't one of the selectable majors, pass `null` so
  // the resolver may detect the original key itself. Additionally, if the
  // resolver doesn't return a validated link, generate the canonical CifraClub
  // URL (artist/song) so the created music has a useful link immediately.
  const cifra = titulo && artista
    ? await resolverCifraValidada({ titulo, artista, tonalidade: isTonalidadeValida(tonalidade) ? tonalidade : null })
    : null;
  const generated = gerarLinkCifraClub({ titulo, artista: artista || null, tonalidade: isTonalidadeValida(tonalidade) ? tonalidade : null, tomOriginal: cifra?.tonalidade ?? null });
  return { titulo, artista: artista || null, tonalidade: cifra?.tonalidade ?? (tonalidade || null), linkCifra: cifra?.linkCifra ?? generated ?? null };
}

async function criarMusicaAutorizada(data: Awaited<ReturnType<typeof readMusicaForm>>): Promise<Musica> {
  const repos = await getRepositories();
  if (repos.backend === "local") {
    return repos.musicas.create(data);
  }

  // A ação já autenticou e validou o usuário. A gravação privilegiada evita
  // que uma política RLS desatualizada impeça membros autorizados de cadastrar
  // repertório pelo celular.
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("musicas")
    .insert({
      titulo: data.titulo,
      artista: data.artista,
      tonalidade: data.tonalidade,
      link_cifra: data.linkCifra,
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
    createdAt: row.created_at,
  };
}

function agendarCifraComTomOriginal(musica: Musica) {
  after(async () => {
    try {
      // Agendar tentativa apenas se não houver link; permitir tentativa mesmo
      // se a tonalidade não foi informada — o resolvedor pode detectá-la.
      if (musica.linkCifra || !musica.artista) return;
      const cifra = await resolverCifraValidada({ titulo: musica.titulo, artista: musica.artista, tonalidade: musica.tonalidade });
      if (!cifra) return;
      const { linkCifra, tonalidade } = cifra;
      console.debug("agendarCifraComTomOriginal: encontrada cifra para", musica.id, { linkCifra, tonalidade });
      const repos = await getRepositories();
      if (repos.backend === "supabase") {
        const admin = createAdminClient();
        // Atualizar pela PK (id) e apenas se `link_cifra IS NULL` para evitar
        // que pequenas diferenças de normalização impeçam a atualização.
        const query = admin
          .from("musicas")
          .update({ link_cifra: linkCifra, tonalidade })
          .eq("id", musica.id)
          .is("link_cifra", null);
        const { error } = await query;
        if (error) throw error;
      } else {
        const atual = await repos.musicas.getById(musica.id);
        if (atual && !atual.linkCifra && atual.titulo === musica.titulo && atual.artista === musica.artista && atual.tonalidade === musica.tonalidade) await repos.musicas.update(musica.id, { linkCifra, tonalidade });
      }
      invalidateDataCache("musicas");
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/musicas");
    } catch (error) {
      console.error("Falha ao atualizar o tom original da cifra:", error);
    }
  });
}

/**
 * Tenta resolver a cifra imediatamente com timeout curto (não bloqueante),
 * atualiza se encontrar; caso contrário, `agendarCifraComTomOriginal` fará
 * uma tentativa posterior.
 */
async function tentarResolverCifraAgora(musica: Musica, timeoutMs = 5000) {
  try {
    if (musica.linkCifra || !musica.artista) return;
    const tentativa = resolverCifraValidada({ titulo: musica.titulo, artista: musica.artista, tonalidade: musica.tonalidade });
    const resultado = await Promise.race([
      tentativa,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    if (!resultado) return;
    const { linkCifra, tonalidade } = resultado;
    const repos = await getRepositories();
    if (repos.backend === "supabase") {
      const admin = createAdminClient();
      const { error } = await admin
        .from("musicas")
        .update({ link_cifra: linkCifra, tonalidade })
        .eq("id", musica.id)
        .is("link_cifra", null);
      if (error) throw error;
    } else {
      const atual = await repos.musicas.getById(musica.id);
      if (atual && !atual.linkCifra) await repos.musicas.update(musica.id, { linkCifra, tonalidade });
    }
    invalidateDataCache("musicas");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/musicas");
  } catch (error) {
    console.debug("tentarResolverCifraAgora: falha ou timeout", musica.id, error);
  }
}

/** Cria uma música sem redirecionar, para uso dentro do modal de uma escala. */
export async function criarMusicaNaEscalaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();
  const tituloError = validateMaxLength(String(formData.get("titulo") ?? "").trim(), FORM_LIMITS.musicaTitulo, "Título");
  if (tituloError) return { error: tituloError };
  const artistaError = validateMaxLength(String(formData.get("artista") ?? "").trim(), FORM_LIMITS.artista, "Artista");
  if (artistaError) return { error: artistaError };
  const data = await readMusicaForm(formData);
  if (!data.titulo) return { error: "Informe o título da música." };
  if (!data.artista) return { error: "Informe o artista para gerar a cifra automaticamente." };
  if (!data.tonalidade) return { error: "Escolha uma tonalidade para a música." };
  if (!isTonalidadeValida(String(formData.get("tonalidade") ?? "").trim())) return { error: TONALIDADE_INVALIDA_MESSAGE };

  let musica: Musica;
  try {
    musica = await criarMusicaAutorizada(data);
  } catch (error) {
    console.error("Falha ao cadastrar música na escala:", error);
    return { error: "Não foi possível salvar a música. Tente novamente." };
  }
  // Tenta resolver rapidamente e agenda uma tentativa posterior caso falhe.
  void tentarResolverCifraAgora(musica, 2500);
  agendarCifraComTomOriginal(musica);
  invalidateDataCache("musicas");
  revalidatePath("/dashboard/musicas");
  revalidatePath("/dashboard");
  return { success: true, musica };
}

export async function criarMusicaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAuth();
  const tituloError = validateMaxLength(String(formData.get("titulo") ?? "").trim(), FORM_LIMITS.musicaTitulo, "Título");
  if (tituloError) return { error: tituloError };
  const artistaError = validateMaxLength(String(formData.get("artista") ?? "").trim(), FORM_LIMITS.artista, "Artista");
  if (artistaError) return { error: artistaError };
  const data = await readMusicaForm(formData);
  if (!data.titulo) return { error: "Informe o título da música." };
  if (!data.artista) return { error: "Informe o artista para gerar a cifra automaticamente." };
  if (!data.tonalidade) return { error: "Escolha uma tonalidade para a música." };
  if (!isTonalidadeValida(String(formData.get("tonalidade") ?? "").trim())) return { error: TONALIDADE_INVALIDA_MESSAGE };
  let musica: Musica;
  try {
    musica = await criarMusicaAutorizada(data);
  } catch (error) {
    console.error("Falha ao cadastrar música:", error);
    return { error: "Não foi possível salvar a música. Tente novamente." };
  }
  // Tenta resolver rapidamente e agenda uma tentativa posterior caso falhe.
  void tentarResolverCifraAgora(musica, 2500);
  agendarCifraComTomOriginal(musica);

  invalidateDataCache("musicas");
  revalidatePath("/dashboard/musicas");
  revalidatePath("/dashboard");
  if (formData.get("preservarPesquisa") === "true") {
    return { success: true, musica };
  }
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
  if (!isTonalidadeValida(String(formData.get("tonalidade") ?? "").trim())) return { error: TONALIDADE_INVALIDA_MESSAGE };
  let musicaAtualizada: Musica;
  try {
    const repos = await getRepositories();
    const atual = await repos.musicas.getById(id);
    if (!atual) return { error: "Música não encontrada." };
    const mesmaCifra =
      atual.titulo.trim().toLocaleLowerCase("pt-BR") === data.titulo.trim().toLocaleLowerCase("pt-BR") &&
      (atual.artista ?? "").trim().toLocaleLowerCase("pt-BR") ===
        (data.artista ?? "").trim().toLocaleLowerCase("pt-BR");
    const cifraNoNovoTom = mesmaCifra
      ? aplicarTonalidadeAoLinkCifra({
          linkCifra: atual.linkCifra,
          tonalidadeOriginal: atual.tonalidade,
          tonalidadeSelecionada: data.tonalidade,
        })
      : null;
    const musica = {
      titulo: data.titulo,
      artista: data.artista,
      tonalidade: cifraNoNovoTom?.tonalidade ?? data.tonalidade,
      linkCifra: cifraNoNovoTom?.linkCifra ?? data.linkCifra ?? (mesmaCifra ? atual.linkCifra : null),
    };
    musicaAtualizada = await repos.musicas.update(id, musica);
    // Se título ou artista mudou, a página também pode ter mudado e precisa ser
    // redetectada. Na simples troca de tom, preservamos a URL exata já validada.
    if (!cifraNoNovoTom) agendarCifraComTomOriginal(musicaAtualizada);
  } catch {
    return { error: "Não foi possível salvar as alterações da música. Tente novamente." };
  }

  invalidateDataCache("musicas");
  revalidatePath("/dashboard/musicas");
  revalidatePath("/dashboard");
  if (formData.get("preservarPesquisa") === "true") {
    return { success: true, musica: musicaAtualizada };
  }
  redirect("/dashboard/musicas");
}

export async function removerMusicaAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Música inválida.");

  const repos = await getRepositories();
  const musica = await repos.musicas.getById(id);
  if (!musica) {
    throw new Error("Música não encontrada.");
  }
  await repos.musicas.remove(id);

  invalidateDataCache("musicas");
  revalidatePath("/dashboard/musicas");
  revalidatePath("/dashboard");
}
