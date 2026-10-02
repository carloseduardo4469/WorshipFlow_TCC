import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ checkRateLimit: vi.fn(), createClient: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/security/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/db/cache", () => ({ invalidateDataCache: vi.fn() }));

import { loginAction } from "./auth";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("limite de tentativas de autenticação", () => {
  it("interrompe o login antes de consultar o Supabase quando a cota acabou", async () => {
    mocks.checkRateLimit.mockResolvedValue({ error: "Muitas tentativas.", retryAfter: 30 });
    const formData = new FormData();
    formData.set("email", "membro@example.com");
    formData.set("senha", "senha-incorreta");

    await expect(loginAction(null, formData)).resolves.toEqual({ error: "Muitas tentativas." });
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("login");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});