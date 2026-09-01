import "server-only";
import { cachedData } from "@/lib/db/cache";
import type { Repositories } from "@/lib/db/repositories";

/** Leituras frequentes e imutáveis entre mutações, compartilhadas por 30 s. */
export function listEscalasCached(repos: Repositories, ministerioId: number) {
  return cachedData(
    `cache:escalas:list:${repos.backend}:${ministerioId}`,
    () => repos.escalas.list(ministerioId)
  );
}

export function listUsuariosCached(repos: Repositories, ministerioId: number) {
  return cachedData(
    `cache:usuarios:list:${repos.backend}:${ministerioId}`,
    () => repos.usuarios.list(ministerioId)
  );
}

export function firstMusicasPageCached(repos: Repositories, ministerioId: number, limit: number) {
  return cachedData(
    `cache:musicas:first-page:${repos.backend}:${ministerioId}:${limit}`,
    () => repos.musicas.search({ ministerioId, offset: 0, limit, campo: "titulo" })
  );
}

export function firstUsuariosPageCached(repos: Repositories, ministerioId: number, limit: number) {
  return cachedData(
    `cache:usuarios:first-page:${repos.backend}:${ministerioId}:${limit}`,
    () => repos.usuarios.search({ ministerioId, offset: 0, limit })
  );
}
