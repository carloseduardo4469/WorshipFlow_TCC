"use client";

import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type ThemeMode = "dark" | "light";
const STORAGE_KEY = "wf-dashboard-theme";
const THEME_EVENT = "wf-dashboard-theme-change";

export function DashboardThemeToggle({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const applyTheme = useCallback((next: ThemeMode) => {
    document.documentElement.dataset.dashboardTheme = next;
    setMode(next);
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    applyTheme(saved === "light" ? "light" : "dark");
    const syncTheme = (event: Event) => applyTheme((event as CustomEvent<ThemeMode>).detail);
    window.addEventListener(THEME_EVENT, syncTheme);
    return () => window.removeEventListener(THEME_EVENT, syncTheme);
  }, [applyTheme]);

  function toggleTheme() {
    const next = mode === "dark" ? "light" : "dark";
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: next }));
  }

  return <button type="button" onClick={toggleTheme} aria-label={mode === "dark" ? "Ativar tema claro" : "Ativar tema escuro"} title={mode === "dark" ? "Ativar tema claro" : "Ativar tema escuro"} className={`db-icon-button ${compact ? "h-10 w-10" : ""}`}>{mode === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>;
}
