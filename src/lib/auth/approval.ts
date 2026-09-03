import "server-only";

const JANELA_NOVO_CADASTRO_MS = 5 * 60 * 1000;

export function usuarioCriadoRecentemente(createdAt: string): boolean {
  const criadoEm = new Date(createdAt).getTime();
  return Number.isFinite(criadoEm) && Date.now() - criadoEm >= 0
    && Date.now() - criadoEm <= JANELA_NOVO_CADASTRO_MS;
}
