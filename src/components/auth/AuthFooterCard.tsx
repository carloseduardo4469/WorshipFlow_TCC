import Image from "next/image";
import Link from "next/link";
import logo from "@/app/icon.png";

const linkBase =
  "font-bold text-[color:var(--af-text)] transition hover:text-amber";

/**
 * Rodapé completo usado na tela de recuperação: logo + descrição, coluna
 * Legal (com direitos autorais) e coluna Contato, além do "Voltar ao topo".
 */
export function AuthFooterCard() {
  return (
    <footer className="af-panel w-full max-w-6xl rounded-[28px] border border-[color:var(--af-border)] p-7 sm:p-9">
      <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr]">
        {/* Marca */}
        <div className="flex flex-col">
          <div className="flex items-start gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
              <Image src={logo} alt="WorshipFlow" fill sizes="56px" className="object-cover" />
            </div>
            <div>
              <p className="font-serif text-xl font-extrabold af-text">WorshipFlow</p>
              <p className="mt-1 text-[13px] font-medium af-muted">
                Gestão simples para ministérios de louvor.
              </p>
            </div>
          </div>

          <div className="mt-auto pt-8">
            <a href="#top" className="af-btn-pill">
              ↑ Voltar ao topo
            </a>
          </div>
        </div>

        {/* Legal */}
        <div>
          <p className="af-label mb-4" style={{ color: "var(--af-text)" }}>
            Legal
          </p>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/termos" className={linkBase}>
                Termos de Uso
              </Link>
            </li>
            <li>
              <Link href="/privacidade" className={linkBase}>
                Política de Privacidade
              </Link>
            </li>
            <li>
              <a href="mailto:Lucasavilagodoi43@gmail.com" className={linkBase}>
                Canal de contato
              </a>
            </li>
          </ul>
          <p className="mt-5 text-xs font-medium af-muted">
            Direitos Autorais 2026 WorshipFlow
          </p>
        </div>

        {/* Contato */}
        <div>
          <p className="af-label mb-4" style={{ color: "var(--af-text)" }}>
            Contato
          </p>
          <ul className="space-y-3 text-sm">
            <li>
              <a href="mailto:Lucasavilagodoi43@gmail.com" className={linkBase}>
                Lucasavilagodoi43@gmail.com
              </a>
            </li>
            <li>
              <a href="mailto:Caduwernck42@gmail.com" className={linkBase}>
                Caduwernck42@gmail.com
              </a>
            </li>
            <li>
              <a href="tel:+5511985520784" className={linkBase}>
                +55 (11) 98552-0784
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
