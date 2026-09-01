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

async function musicasPertencemAoMinisterio(
  repos: Awaited<ReturnType<typeof getRepositories>>,
  musicaIds: number[],
  ministerioId: number
) {
  const musicas = await repos.musicas.getByIds(musicaIds);
  return musicas.length === musicaIds.length
    && musicas.every((musica) => musica.ministerioId === ministerioId);
}

export async function criarRepertorioAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireAdmin();
  if (profile.ministerioId === null) return { error: "Seu perfil não está vinculado a um ministério." };
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const musicaIds = readMusicaIds(formData);

  const textoError = validarTextos(nome, descricao);
  if (textoError) return { error: textoError };

  const repos = await getRepositories();
  if (!(await musicasPertencemAoMinisterio(repos, musicaIds, profile.ministerioId))) {
    return { error: "Uma ou mais músicas não pertencem ao seu ministério." };
  }
  const repertorio = await repos.repertorios.create({
    nome,
    descricao: descricao || null,
    ministerioId: profile.ministerioId,
  });
  try {
    await repos.repertorios.setMusicas(repertorio.id, musicaIds);
  } catch (error) {
    await repos.repertorios.remove(repertorio.id).catch(() => {});
    console.error("Falha ao vincular músicas ao repertório:", error);
    return { error: "Não foi possível concluir o repertório. Nenhum registro incompleto foi mantido." };
  }

  invalidateDataCache("repertorios");
  revalidatePath("/dashboard/historico");
  revalidatePath("/dashboard");
  redirect("/dashboard/historico");
}

export async function atualizarRepertorioAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireAdmin();
  if (profile.ministerioId === null) return { error: "Seu perfil não está vinculado a um ministério." };
  const id = Number(formData.get("id"));
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const musicaIds = readMusicaIds(formData);

  if (!Number.isInteger(id) || id <= 0) return { error: "Repertório inválido." };
  const textoError = validarTextos(nome, descricao);
  if (textoError) return { error: textoError };

  const repos = await getRepositories();
  const atual = await repos.repertorios.getById(id);
  if (!atual || atual.ministerioId !== profile.ministerioId) return { error: "Repertório não encontrado." };
  if (!(await musicasPertencemAoMinisterio(repos, musicaIds, profile.ministerioId))) {
    return { error: "Uma ou mais músicas não pertencem ao seu ministério." };
  }
  try {
    await repos.repertorios.update(id, {
      nome,
      descricao: descricao || null,
      ministerioId: profile.ministerioId,
    });
    await repos.repertorios.setMusicas(id, musicaIds);
  } catch (error) {
    await repos.repertorios.update(id, {
      nome: atual.nome,
      descricao: atual.descricao,
      ministerioId: atual.ministerioId,
    }).catch(() => {});
    await repos.repertorios.setMusicas(id, atual.musicaIds).catch(() => {});
    console.error("Falha ao atualizar repertório:", error);
    return { error: "Não foi possível atualizar o repertório. Os dados anteriores foram preservados." };
  }

  invalidateDataCache("repertorios");
  revalidatePath("/dashboard/historico");
  revalidatePath("/dashboard");
  redirect("/dashboard/historico");
}

export async function removerRepertorioAction(formData: FormData) {
  const { profile } = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Repertório inválido.");

  const repos = await getRepositories();
  const repertorio = await repos.repertorios.getById(id);
  if (!repertorio || profile.ministerioId === null || repertorio.ministerioId !== profile.ministerioId) {
    throw new Error("Repertório não encontrado.");
  }
  await repos.repertorios.remove(id);

  invalidateDataCache("repertorios");
  revalidatePath("/dashboard/historico");
  revalidatePath("/dashboard");
}
