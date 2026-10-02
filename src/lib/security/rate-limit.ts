import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// Uma mesma cota é usada em todas as telas que executam a mesma operação.
export const RATE_LIMITS = {
  login: { limit: 10, window: 60 },
  cadastro: { limit: 5, window: 900 },
  recuperarSenha: { limit: 3, window: 900 },
  redefinirSenha: { limit: 5, window: 900 },
  google: { limit: 10, window: 300 },
  musicas: { limit: 10, window: 60 },
  escalas: { limit: 20, window: 60 },
  repertorios: { limit: 20, window: 60 },
  perfil: { limit: 6, window: 60 },
  administrarUsuarios: { limit: 30, window: 60 },
  excluirConta: { limit: 3, window: 900 },
  excluir: { limit: 10, window: 60 },
  push: { limit: 10, window: 60 },
  notificacoes: { limit: 30, window: 60 },
  consultar: { limit: 120, window: 60 },
  presenca: { limit: 6, window: 60 },
} as const;

type Policy = keyof typeof RATE_LIMITS;
export type RateLimitError = { error: string; retryAfter: number };

const localBuckets = new Map<string, { hits: number; expiresAt: number }>();

function checkLocalRateLimit(policy: Policy, identity: string): RateLimitError | null {
  const now = Date.now();
  const { limit, window } = RATE_LIMITS[policy];
  const key = `${policy}:${identity}`;
  let bucket = localBuckets.get(key);

  if (!bucket || bucket.expiresAt <= now) {
    bucket = { hits: 0, expiresAt: now + window * 1000 };
    localBuckets.set(key, bucket);
  }
  if (bucket.hits >= limit) {
    return {
      error: `Muitas tentativas. Aguarde ${Math.max(1, Math.ceil((bucket.expiresAt - now) / 1000))} segundos e tente novamente.`,
      retryAfter: Math.max(1, Math.ceil((bucket.expiresAt - now) / 1000)),
    };
  }

  bucket.hits += 1;
  if (localBuckets.size > 1000) {
    for (const [bucketKey, value] of localBuckets) {
      if (value.expiresAt <= now) localBuckets.delete(bucketKey);
    }
  }
  return null;
}

/** Só confiar no IP sobrescrito pela infraestrutura configurada pelo operador. */
async function requestIdentity() {
  const headerName = process.env.VERCEL === "1"
    ? "x-vercel-forwarded-for"
    : process.env.RATE_LIMIT_TRUSTED_IP_HEADER;
  if (!headerName) {
    if (process.env.NODE_ENV !== "production") return "ip:desenvolvimento";
    throw new Error("Configure o proxy confiável para identificar o IP.");
  }
  const value = (await headers()).get(headerName)?.trim() ?? "";
  // Uma lista arbitrária de IPs não deve permitir escolher uma identidade nova.
  if (!isIP(value)) throw new Error("IP confiável ausente ou inválido.");
  const ip = isIP(value) === 6 ? new URL(`http://[${value}]`).hostname : value;
  return `ip:${ip}`;
}

/** Contagem atômica no banco; falhas nunca liberam uma operação desprotegida. */
export async function checkRateLimit(policy: Policy, authId?: string): Promise<RateLimitError | null> {
  try {
    const identity = authId ? `user:${authId}` : await requestIdentity();
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) throw new Error("Contador não configurado.");
    const key = createHmac("sha256", secret).update(`${policy}:${identity}`).digest("hex");
    const { limit, window } = RATE_LIMITS[policy];
    const { data, error } = await createAdminClient().rpc("consume_form_rate_limit", {
      p_key: key, p_limit: limit, p_window_seconds: window,
    }).abortSignal(AbortSignal.timeout(3000));
    if (error) throw new Error("Contador indisponível.");
    if (!data || typeof data.allowed !== "boolean" || !Number.isInteger(data.retry_after) || data.retry_after < 0) {
      throw new Error("Resposta inválida do contador.");
    }
    if (data.allowed) return null;
    const retryAfter = Math.max(1, data.retry_after);
    return { error: `Muitas tentativas. Aguarde ${retryAfter} segundos e tente novamente.`, retryAfter };
  } catch {
    if (policy === "consultar") {
      return checkLocalRateLimit(policy, authId ? `user:${authId}` : "ip:consulta");
    }
    // Não registrar IP, email, sessão, chaves nem payloads dos formulários.
    console.error("[rate-limit] Não foi possível verificar o limite de envios.");
    return { error: "Não foi possível verificar o limite de envios. Tente novamente em instantes.", retryAfter: 30 };
  }
}
