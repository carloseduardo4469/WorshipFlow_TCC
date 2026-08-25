import "server-only";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveBackend } from "@/lib/db/provider";
import { createMinisteriosRepository } from "./ministerios";
import { createMusicasRepository } from "./musicas";
import { createRepertoriosRepository } from "./repertorios";
import { createUsuariosRepository } from "./usuarios";
import { createEscalasRepository } from "./escalas";
import type { Repositories } from "./types";

/**
 * Ponto único de entrada da camada de dados. Chame isso em Server
 * Components, Route Handlers ou Server Actions:
 *
 *   const repos = await getRepositories();
 *   const ministerios = await repos.ministerios.list();
 *
 * Resolve automaticamente Supabase vs. SQLite local (ver provider.ts) —
 * o resto do código nunca precisa saber qual dos dois está em uso.
 */
export async function getRepositories(): Promise<Repositories> {
  const backend = await resolveBackend();
  const supabase = backend === "supabase" ? await createSupabaseServerClient() : null;

  return {
    backend,
    ministerios: createMinisteriosRepository(backend, supabase),
    musicas: createMusicasRepository(backend, supabase),
    repertorios: createRepertoriosRepository(backend, supabase),
    usuarios: createUsuariosRepository(backend, supabase),
    escalas: createEscalasRepository(backend, supabase),
  };
}

export type { Repositories } from "./types";
