import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ admin: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.admin }));

import { checkRateLimit } from "./rate-limit";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("fallback local para consultas", () => {
  it("mantém a consulta disponível sem RPC, mas continua limitando chamadas repetidas", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const identity = `local-search-${Date.now()}`;

    for (let attempt = 0; attempt < 120; attempt++) {
      await expect(checkRateLimit("consultar", identity)).resolves.toBeNull();
    }
    await expect(checkRateLimit("consultar", identity)).resolves.toMatchObject({
      retryAfter: expect.any(Number),
    });
  });

  it("mantém gravações funcionando com limite local se faltar a chave do contador", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const identity = `local-write-${Date.now()}`;

    for (let attempt = 0; attempt < 10; attempt++) {
      await expect(checkRateLimit("musicas", identity)).resolves.toBeNull();
    }
    await expect(checkRateLimit("musicas", identity)).resolves.toMatchObject({ retryAfter: expect.any(Number) });
  });

  it("usa a mesma contingência se a chamada RPC falhar", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
    const abortSignal = vi.fn().mockResolvedValue({ data: null, error: new Error("RPC ausente") });
    mocks.admin.mockReturnValue({ rpc: vi.fn(() => ({ abortSignal })) });
    const identity = `rpc-failure-${Date.now()}`;

    await expect(checkRateLimit("perfil", identity)).resolves.toBeNull();
    expect(abortSignal).toHaveBeenCalledOnce();
  });

  it("não bloqueia visitantes em conjunto se faltar IP confiável", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "0");
    vi.stubEnv("RATE_LIMIT_TRUSTED_IP_HEADER", "");

    await expect(checkRateLimit("login")).resolves.toBeNull();
  });
});