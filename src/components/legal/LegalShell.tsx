"use client";

import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";
const STORAGE_KEY = "wf-legal-theme";

export function LegalShell({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const router = useRouter();

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const next = saved === "light" ? "light" : "dark";
    setMode(next);
    document.documentElement.dataset.legalTheme = next;
    return () => { delete document.documentElement.dataset.legalTheme; };
  }, []);

  function toggleTheme() {
    const next = mode === "dark" ? "light" : "dark";
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.dataset.legalTheme = next;
    setMode(next);
  }

  return (
    <div className={`legal-theme ${mode === "light" ? "legal-theme-light" : ""}`}>
      <div aria-hidden className="legal-grid pointer-events-none fixed inset-0" />
      <header className="legal-header">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" onClick={() => window.history.length > 1 ? router.back() : router.push("/login")} className="legal-back-button" aria-label="Voltar">
            <ArrowLeft size={16} /> <span>Voltar</span>
          </button>
          <Link href="/" className="legal-brand">WorshipFlow</Link>
        </div>
        <nav aria-label="Páginas institucionais" className="legal-nav">
          <Link href="/termos">Termos</Link>
          <Link href="/privacidade">Privacidade</Link>
          <button type="button" onClick={toggleTheme} className="legal-theme-button" aria-label={mode === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}>
            {mode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </nav>
      </header>
      <main className="legal-main">{children}</main>
    </div>
  );
}
