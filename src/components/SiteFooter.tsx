import Link from "next/link";

export function SiteFooter({ dashboard = false }: { dashboard?: boolean }) {
  return (
    <footer className={`site-footer relative border-t border-white/10 bg-[#07101e] px-5 py-6 text-[#aeb8ca] ${dashboard ? "site-footer-dashboard z-0 pb-[calc(.75rem+70px+env(safe-area-inset-bottom))] lg:ml-[278px] lg:pb-6" : "z-20"}`}>
      <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <p className="text-xs font-semibold">&copy; {new Date().getFullYear()} WorshipFlow</p>
        <nav aria-label="Links institucionais" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold">
          <Link prefetch={false} href="/termos" className="transition hover:text-[#f7f6f1]">Termos de Uso</Link>
          <Link prefetch={false} href="/privacidade" className="transition hover:text-[#f7f6f1]">Privacidade</Link>
          <Link prefetch={false} href="/termos#contato" className="transition hover:text-[#f7f6f1]">Contato</Link>
        </nav>
      </div>
    </footer>
  );
}
