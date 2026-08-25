"use client";

import { useEffect } from "react";

/**
 * Registra o Service Worker uma única vez (em produção e após montagem no
 * cliente). Em dev o Next.js já recarrega os módulos a quente e o SW
 * atrapalharia — por isso só ativamos quando import.meta.env.PROD.
 */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.error("Falha ao registrar Service Worker:", err));
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}