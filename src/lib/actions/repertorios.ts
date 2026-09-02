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

async function musicasExistem(
  repos: Awaited<ReturnType<typeof getRepositories>>,
  musicaIds: number[]
) {
  const musicas = await repos.musicas.getByIds(musicaIds);
  return musicas.length === musicaIds.length;
}

export async function criarRepertorioAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const musicaIds = readMusicaIds(formData);

  const textoError = validarTextos(nome, descricao);
  if (textoError) return { error: textoError };

  const repos = await getRepositories();
  if (!(await musicasExistem(repos, musicaIds))) {
    return { error: "Uma ou mais músicas selecionadas não existem mais." };
  }
  const repertorio = await repos.repertorios.create({
    nome,
    descricao: descricao || null,
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
  await requireAdmin();
  const id = Number(formData.get("id"));
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const musicaIds = readMusicaIds(formData);

  if (!Number.isInteger(id) || id <= 0) return { error: "Repertório inválido." };
  const textoError = validarTextos(nome, descricao);
  if (textoError) return { error: textoError };

  const repos = await getRepositories();
  const atual = await repos.repertorios.getById(id);
  if (!atual) return { error: "Repertório não encontrado." };
  if (!(await musicasExistem(repos, musicaIds))) {
    return { error: "Uma ou mais músicas selecionadas não existem mais." };
  }
  try {
    await repos.repertorios.update(id, {
      nome,
      descricao: descricao || null,
    });
    await repos.repertorios.setMusicas(id, musicaIds);
  } catch (error) {
    await repos.repertorios.update(id, {
      nome: atual.nome,
      descricao: atual.descricao,
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
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Repertório inválido.");

  const repos = await getRepositories();
  const repertorio = await repos.repertorios.getById(id);
  if (!repertorio) {
    throw new Error("Repertório não encontrado.");
  }
  await repos.repertorios.remove(id);

  invalidateDataCache("repertorios");
  revalidatePath("/dashboard/historico");
  revalidatePath("/dashboard");
}
