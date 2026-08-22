"use client";

import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type ThemeMode = "dark" | "light";

const STORAGE_KEY = "wf-auth-theme";

/**
 * Estrutura das telas de autenticação: fundo navy com grade quadriculada,
 * toggle de tema fixo no canto superior direito e conteúdo centralizado.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");

  // Recupera a preferência salva depois da hidratação (evita mismatch de SSR).
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") setMode(saved);
  }, []);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <div
      id="top"
      className={`auth-theme af-bg relative min-h-screen ${mode === "light" ? "light" : ""}`}
    >
      <div aria-hidden className="af-gridlines pointer-events-none absolute inset-0" />

      <button
        type="button"
        onClick={toggleMode}
        aria-label={mode === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
        className="af-theme-toggle"
      >
        {mode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      <main className="relative z-10 flex min-h-screen flex-col items-center gap-6 px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
    </div>
  );
}
