import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  THEME_EVENT,
  THEME_STORAGE_KEY,
  applyTheme,
  readTheme,
  setTheme,
  subscribeToTheme,
} from "./client";

describe("tema compartilhado", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-auth-theme");
    document.documentElement.removeAttribute("data-dashboard-theme");
    document.documentElement.removeAttribute("data-legal-theme");
    document.head.innerHTML = '<meta name="theme-color" content="#000000">';
  });

  it("recupera preferências antigas durante a migração", () => {
    localStorage.setItem("wf-legal-theme", "light");
    expect(readTheme()).toBe("light");
  });

  it("aplica o mesmo tema em todas as áreas sem persistir por padrão", () => {
    applyTheme("light");

    expect(document.documentElement.dataset).toMatchObject({
      theme: "light",
      authTheme: "light",
      dashboardTheme: "light",
      legalTheme: "light",
    });
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute("content", "#f6f8f5");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("persiste e comunica a troca de tema", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToTheme(listener);

    setTheme("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(listener).toHaveBeenCalledWith("dark");

    unsubscribe();
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: "light" }));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
