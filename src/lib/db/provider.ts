import "server-only";
import type { Backend } from "./repositories/types";

/**
 * Decide qual backend usar nesta requisição: 'supabase' (padrão) ou 'local'
 * (fallback em SQLite, para dev em rede que bloqueia a conexão direta ao
 * Postgres/proxy do Supabase).
 *
 * DB_MODE no .env força um dos dois; sem ele, tenta Supabase primeiro e
 * cai pro local automaticamente se a checagem falhar ou der timeout.
 * O resultado fica em cache por CACHE_MS pra não bater no Supabase a cada
 * requisição em dev.
 */

const CACHE_MS = 60_000;
const HEALTHCHECK_TIMEOUT_MS = 2_500;

let cachedBackend: Backend | null = null;
let cachedAt = 0;

async function checkSupabaseHealth(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTHCHECK_TIMEOUT_MS);

    // Endpoint leve do GoTrue, não bate no banco — só confirma que dá
    // pra alcançar o Supabase pela porta 443.
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: anonKey },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export async function resolveBackend(): Promise<Backend> {
  const mode = (process.env.DB_MODE ?? "auto").toLowerCase();
  if (mode === "supabase") return "supabase";
  if (mode === "local") return "local";

  const now = Date.now();
  if (cachedBackend && now - cachedAt < CACHE_MS) {
    return cachedBackend;
  }

  const healthy = await checkSupabaseHealth();
  cachedBackend = healthy ? "supabase" : "local";
  cachedAt = now;

  if (!healthy) {
    console.warn(
      "[worshipflow/db] Supabase inacessível — usando SQLite local (.data/local.db) para este processo."
    );
  }

  return cachedBackend;
}

/** Útil pra forçar uma nova checagem antes do cache expirar (ex.: botão "tentar de novo"). */
export function invalidateBackendCache() {
  cachedBackend = null;
  cachedAt = 0;
}
