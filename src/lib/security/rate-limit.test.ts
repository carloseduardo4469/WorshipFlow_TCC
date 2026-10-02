import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { checkRateLimit } from "./rate-limit";

afterEach(() => vi.unstubAllEnvs());

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

  it("continua bloqueando gravações se o contador compartilhado estiver indisponível", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    await expect(checkRateLimit("musicas", "user-write-no-sql")).resolves.toMatchObject({
      retryAfter: 30,
    });
  });
});