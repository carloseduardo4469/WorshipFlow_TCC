"use client";

import { useEffect } from "react";
import { registrarAtividade } from "@/lib/actions/usuarios";

/**
 * Heartbeat de presença: marca o usuário como Online enquanto ele estiver
 * com a página aberta (roda junto do layout do dashboard).
 */
export function PresenceTracker() {
  useEffect(() => {
    function bater() {
      registrarAtividade().catch(() => {});
    }

    bater();
    const timer = window.setInterval(bater, 60_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") bater();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}