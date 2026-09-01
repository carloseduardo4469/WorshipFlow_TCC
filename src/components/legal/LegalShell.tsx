"use client";

import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { applyTheme, setTheme, useThemeMode } from "@/lib/theme/client";

export function LegalShell({ children, currentPage }: { children: React.ReactNode; currentPage: "termos" | "privacidade" }) {
  const mode = useThemeMode();

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  function toggleTheme() {
    const next = mode === "dark" ? "light" : "dark";
    setTheme(next);
  }

  return (
    <div className={`legal-theme ${mode === "light" ? "legal-theme-light" : ""}`}>
      <div aria-hidden className="legal-grid pointer-events-none fixed inset-0" />
      <header className="legal-header">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/" className="legal-back-button" aria-label="Voltar ao início">
            <ArrowLeft size={16} /> <span>Voltar</span>
          </Link>
          <Link href="/" className="legal-brand">WorshipFlow</Link>
        </div>
        <nav aria-label="Páginas institucionais" className="legal-nav">
          {currentPage !== "termos" && <Link href="/termos">Termos</Link>}
          {currentPage !== "privacidade" && <Link href="/privacidade">Privacidade</Link>}
          <button type="button" onClick={toggleTheme} className="legal-theme-button" aria-label={mode === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}>
            {mode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </nav>
      </header>
      <main className="legal-main">{children}</main>
    </div>
  );
}
