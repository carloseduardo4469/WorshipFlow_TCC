"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { invalidateDataCache } from "@/lib/db/cache";
import type { FuncaoUsuario, StatusEscala, TonalidadeMusica } from "@/types/domain";

export type ActionState = { error?: string } | null;

const STATUS_VALIDOS: StatusEscala[] = ["RASCUNHO", "PUBLICADA", "CONCLUIDA", "CANCELADA"];

function dataEscalaValida(dataEscala: string | null) {
  if (!dataEscala) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataEscala)) return false;

  const [year, month, day] = dataEscala.split("-").map(Number);
  const data = new Date(Date.UTC(year, month - 1, day));
  if (
    data.getUTCFullYear() !== year ||
    data.getUTCMonth() !== month - 1 ||
    data.getUTCDate() !== day
  ) return false;

  const hoje = new Date();
  const hojeIso = [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, "0"),
    String(hoje.getDate()).padStart(2, "0"),
  ].join("-");
  return dataEscala >= hojeIso;
}

function readEscalaForm(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const dataEscala = String(formData.get("dataEscala") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "RASCUNHO");
  const observacoes = String(formData.get("observacoes") ?? "").trim();
  const ministerioIdRaw = String(formData.get("ministerioId") ?? "").trim();

  const usuarioIds = formData.getAll("usuarioIds").map(String);
  const musicaIds = formData.getAll("musicaIds").map((v) => Number(v));

  // funcoes[usuarioId] = "Vocal" | "Guitarra" | ...
  const funcoesUsuarios: FuncaoUsuario[] = usuarioIds
    .map((usuarioId) => ({
      usuarioId,
      funcao: String(formData.get(`funcao_${usuarioId}`) ?? "").trim(),
    }))
    .filter((f) => f.funcao);

  // tonalidade[musicaId] = "G" | "Am" | ...
  const tonalidadesMusicas: TonalidadeMusica[] = musicaIds
    .map((musicaId) => ({
      musicaId,
      tonalidade: String(formData.get(`tonalidade_${musicaId}`) ?? "").trim(),
    }))
    .filter((t) => t.tonalidade);

  const status = STATUS_VALIDOS.includes(statusRaw as StatusEscala)
    ? (statusRaw as StatusEscala)
    : "RASCUNHO";

  return {
    titulo,
    dataEscala: dataEscala || null,
    status,
    observacoes: observacoes || null,
    ministerioId: ministerioIdRaw ? Number(ministerioIdRaw) : null,
    funcoesUsuarios,
    tonalidadesMusicas,
    usuarioIds,
    musicaIds,
  };
}

export async function criarEscalaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const data = readEscalaForm(formData);
  if (!data.titulo) return { error: "Informe o título da escala." };
  if (!dataEscalaValida(data.dataEscala)) return { error: "Informe uma data válida a partir de hoje." };

  const repos = await getRepositories();
  const escala = await repos.escalas.create({
    titulo: data.titulo,
    dataEscala: data.dataEscala,
    status: data.status,
    observacoes: data.observacoes,
    ministerioId: data.ministerioId,
    funcoesUsuarios: data.funcoesUsuarios,
    tonalidadesMusicas: data.tonalidadesMusicas,
  });
  await repos.escalas.setUsuarios(escala.id, data.usuarioIds);
  await repos.escalas.setMusicas(escala.id, data.musicaIds);

  invalidateDataCache("escalas");
  revalidatePath("/dashboard/escalas");
  revalidatePath("/dashboard/admin/escalas");
  revalidatePath("/dashboard");
  redirect("/dashboard/admin/escalas");
}

export async function atualizarEscalaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const data = readEscalaForm(formData);
  if (!data.titulo) return { error: "Informe o título da escala." };
  if (!dataEscalaValida(data.dataEscala)) return { error: "Informe uma data válida a partir de hoje." };

  const repos = await getRepositories();
  await repos.escalas.update(id, {
    titulo: data.titulo,
    dataEscala: data.dataEscala,
    status: data.status,
    observacoes: data.observacoes,
    ministerioId: data.ministerioId,
    funcoesUsuarios: data.funcoesUsuarios,
    tonalidadesMusicas: data.tonalidadesMusicas,
  });
  await repos.escalas.setUsuarios(id, data.usuarioIds);
  await repos.escalas.setMusicas(id, data.musicaIds);

  invalidateDataCache("escalas");
  revalidatePath("/dashboard/escalas");
  revalidatePath("/dashboard/admin/escalas");
  revalidatePath("/dashboard");
  redirect("/dashboard/admin/escalas");
}

export async function removerEscalaAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));

  const repos = await getRepositories();
  await repos.escalas.remove(id);

  invalidateDataCache("escalas");
  revalidatePath("/dashboard/escalas");
  revalidatePath("/dashboard/admin/escalas");
  revalidatePath("/dashboard");
}
