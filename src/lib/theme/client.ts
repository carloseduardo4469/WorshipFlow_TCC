"use client";

import { useSyncExternalStore } from "react";

export type ThemeMode = "dark" | "light";

export const THEME_STORAGE_KEY = "wf-theme";
export const THEME_EVENT = "wf-theme-change";

const LEGACY_KEYS = ["wf-dashboard-theme", "wf-auth-theme", "wf-legal-theme"];

export function readTheme(): ThemeMode {
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    ?? LEGACY_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
  return saved === "light" ? "light" : "dark";
}

export function applyTheme(mode: ThemeMode, persist = false) {
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.dataset.authTheme = mode;
  root.dataset.dashboardTheme = mode;
  root.dataset.legalTheme = mode;

  const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  themeMeta?.setAttribute("content", mode === "light" ? "#f6f8f5" : "#07101e");

  if (persist) window.localStorage.setItem(THEME_STORAGE_KEY, mode);
}

export function setTheme(mode: ThemeMode) {
  applyTheme(mode, true);
  window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_EVENT, { detail: mode }));
}

export function subscribeToTheme(listener: (mode: ThemeMode) => void) {
  const handle = (event: Event) => listener((event as CustomEvent<ThemeMode>).detail);
  window.addEventListener(THEME_EVENT, handle);
  return () => window.removeEventListener(THEME_EVENT, handle);
}

export function useThemeMode() {
  return useSyncExternalStore(subscribeToTheme, readTheme, () => "dark" as const);
}
