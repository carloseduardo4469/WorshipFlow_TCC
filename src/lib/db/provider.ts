import "server-only";
import type { Backend } from "./repositories/types";

/**
 * Decide qual backend usar nesta requisição: 'supabase' (padrão) ou 'local'.
 *
 * O SQLite contém dados independentes e só pode ser usado quando DB_MODE=local
 * for definido explicitamente. O modo auto continua disponível para ambientes
 * de demonstração, mas nunca é ativado silenciosamente.
 * O resultado fica em cache por CACHE_MS pra não bater no Supabase a cada
 * requisição em dev.
 */

// Evita fazer uma verificação de rede em toda navegação. Em caso de queda,
// o fallback local acontece rápido em vez de prender a página por segundos.
const CACHE_MS = 5 * 60_000;
const HEALTHCHECK_TIMEOUT_MS = 1_000;

let cachedBackend: Backend | null = null;
let cachedAt = 0;

async function checkSupabaseHealth(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTHCHECK_TIMEOUT_MS);
    try {
      // Endpoint leve do GoTrue, não bate no banco — só confirma que dá
      // pra alcançar o Supabase pela porta 443.
      const res = await fetch(`${url}/auth/v1/health`, {
        headers: { apikey: anonKey },
        signal: controller.signal,
        cache: "no-store",
      });
      return res.ok;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return false;
  }
}

export async function resolveBackend(): Promise<Backend> {
  const mode = (process.env.DB_MODE ?? "supabase").toLowerCase();
  if (mode === "supabase") return "supabase";
  if (mode === "local") return "local";
  if (mode !== "auto") {
    console.warn(`[worshipflow/db] DB_MODE desconhecido: ${mode}. Usando Supabase.`);
    return "supabase";
  }

  // Em serverless (Vercel) o filesystem é read-only: o fallback pro SQLite
  // nunca pode acontecer lá, senão toda request quebra. Força Supabase —
  // se o Supabase estiver mesmo fora do ar, o erro vem dele, e fica claro.
  if (process.env.VERCEL === "1") return "supabase";

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
