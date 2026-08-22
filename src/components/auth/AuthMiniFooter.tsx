import Link from "next/link";

const linkBase = "transition hover:text-[color:var(--af-text)]";

/** Linha fina de links exibida abaixo do card em login/cadastro. */
export function AuthMiniFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 pb-4 pt-2 text-xs font-semibold af-muted">
      <Link href="/termos" className={linkBase}>
        Termos de Uso
      </Link>
      <Link href="/privacidade" className={linkBase}>
        Privacidade
      </Link>
      <a href="mailto:Lucasavilagodoi43@gmail.com" className={linkBase}>
        Contato
      </a>
      <a href="#top" className={linkBase}>
        Voltar ao topo
      </a>
    </footer>
  );
}
