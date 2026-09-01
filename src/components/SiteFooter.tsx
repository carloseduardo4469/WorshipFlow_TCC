"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  const dentroDoDashboard = pathname.startsWith("/dashboard");

  return (
    <footer className={`site-footer relative z-20 border-t border-white/10 bg-[#07101e] px-5 py-6 text-[#aeb8ca] ${dentroDoDashboard ? "site-footer-dashboard pb-[calc(1rem+82px+env(safe-area-inset-bottom))] lg:ml-[278px] lg:pb-6" : ""}`}>
      <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <p className="text-xs font-semibold">© {new Date().getFullYear()} WorshipFlow</p>
        <nav aria-label="Links institucionais" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold">
          <Link href="/termos" className="transition hover:text-[#f7f6f1]">Termos de Uso</Link>
          <Link href="/privacidade" className="transition hover:text-[#f7f6f1]">Privacidade</Link>
          <Link href="/termos#contato" className="transition hover:text-[#f7f6f1]">Contato</Link>
        </nav>
      </div>
    </footer>
  );
}
