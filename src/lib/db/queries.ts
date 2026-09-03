import "server-only";
import { cachedData } from "@/lib/db/cache";
import type { Repositories } from "@/lib/db/repositories";

/** Leituras frequentes e imutáveis entre mutações, compartilhadas por 30 s. */
export function listEscalasCached(repos: Repositories) {
  return cachedData(
    `cache:escalas:list:${repos.backend}`,
    () => repos.escalas.list()
  );
}

export function listUsuariosCached(repos: Repositories) {
  return cachedData(
    `cache:usuarios:list:${repos.backend}`,
    () => repos.usuarios.list()
  );
}

export function listTodosUsuariosCached(repos: Repositories) {
  return cachedData(
    `cache:usuarios:list-all:${repos.backend}`,
    () => repos.usuarios.listAll()
  );
}

export function firstMusicasPageCached(repos: Repositories, limit: number) {
  return cachedData(
    `cache:musicas:first-page:${repos.backend}:${limit}`,
    () => repos.musicas.search({ offset: 0, limit, campo: "titulo" })
  );
}

export function firstUsuariosPageCached(repos: Repositories, limit: number) {
  return cachedData(
    `cache:usuarios:first-page:${repos.backend}:${limit}`,
    () => repos.usuarios.search({ offset: 0, limit })
  );
}
