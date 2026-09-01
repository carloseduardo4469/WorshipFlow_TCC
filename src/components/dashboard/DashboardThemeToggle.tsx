"use client";

import { Moon, Sun } from "lucide-react";
import { setTheme, useThemeMode } from "@/lib/theme/client";

export function DashboardThemeToggle({ compact = false }: { compact?: boolean }) {
  const mode = useThemeMode();
  function toggleTheme() {
    const next = mode === "dark" ? "light" : "dark";
    setTheme(next);
  }

  return <button type="button" onClick={toggleTheme} aria-label={mode === "dark" ? "Ativar tema claro" : "Ativar tema escuro"} title={mode === "dark" ? "Ativar tema claro" : "Ativar tema escuro"} className={`db-icon-button ${compact ? "h-10 w-10" : ""}`}>{mode === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>;
}
