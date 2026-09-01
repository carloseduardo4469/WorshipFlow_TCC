"use client";

import { Moon, Sun } from "lucide-react";
import { setTheme, useThemeMode } from "@/lib/theme/client";

/**
 * Estrutura das telas de autenticação: fundo navy com grade quadriculada,
 * toggle de tema fixo no canto superior direito e conteúdo centralizado.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const mode = useThemeMode();

  function toggleMode() {
    setTheme(mode === "dark" ? "light" : "dark");
  }

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
