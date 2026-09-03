import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateDataCache } from "@/lib/db/cache";

const JANELA_NOVO_CADASTRO_MS = 5 * 60 * 1000;

export function usuarioCriadoRecentemente(createdAt: string): boolean {
  const criadoEm = new Date(createdAt).getTime();
  return Number.isFinite(criadoEm) && Date.now() - criadoEm >= 0
    && Date.now() - criadoEm <= JANELA_NOVO_CADASTRO_MS;
}

export async function marcarCadastroPendente(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ status_ministerio: "PENDENTE" })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Profile do novo cadastro nao encontrado.");
  invalidateDataCache("usuarios");
}
