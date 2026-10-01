import "server-only";

/**
 * Contas desta lista mantêm autenticação e perfil próprio, mas não integram
 * listas públicas, administração de membros ou seletores de escala.
 */
export const EMAILS_OCULTOS_DA_EQUIPE = ["caduwerneck42@gmail.com"] as const;

export function isEmailOcultoDaEquipe(email: string | null | undefined) {
  if (!email) return false;
  return EMAILS_OCULTOS_DA_EQUIPE.includes(email.trim().toLowerCase() as typeof EMAILS_OCULTOS_DA_EQUIPE[number]);
}

export function filtrarUsuariosVisiveis<T extends { email: string }>(usuarios: T[]) {
  return usuarios.filter((usuario) => !isEmailOcultoDaEquipe(usuario.email));
}
