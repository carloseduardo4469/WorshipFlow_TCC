import "server-only";

/**
 * Cache leve em memória por processo, para leituras de dados (list/getById).
 *
 * Motivação: cada navegação no dashboard re-renderiza os Server Components e,
 * sem cache, dispara N requisições ao Supabase/SQLite DE NOVO a cada troca de
 * tela. Com este cache de TTL curto, voltar para uma página recentemente
 * visitada NÃO re-consulta o banco — a leitura vem da memória.
 *
 * As mutações passam sempre pelo DB (reads nunca são cacheadas), e cada
 * Server Action invalida a tag correspondente via invalidateDataCache(),
 * garantindo que o dado alterado apareça na próxima visita.
 */

const DATA_CACHE_TTL_MS = 30_000;

const store = new Map<string, { value: unknown; expiresAt: number }>();
const pending = new Map<string, Promise<unknown>>();

/** Lê do cache ou executa a função e armazena o resultado por TTL. */
export function cachedData<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = DATA_CACHE_TTL_MS
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return Promise.resolve(hit.value as T);
  }

  const running = pending.get(key);
  if (running) return running as Promise<T>;

  const request = Promise.resolve()
    .then(fn)
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}

/** Remove todas as chaves de uma tag de domínio — use após mutações. */
export function invalidateDataCache(...tags: string[]): void {
  for (const tag of tags) {
    const prefix = `cache:${tag}:`;
    for (const key of Array.from(store.keys())) {
      if (key.startsWith(prefix)) {
        store.delete(key);
      }
    }
  }
}