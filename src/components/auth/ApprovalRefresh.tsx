"use client";

import { useCallback, useEffect, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function ApprovalRefresh() {
  const router = useRouter();
  const [atualizando, startTransition] = useTransition();

  const atualizar = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  useEffect(() => {
    const timer = window.setInterval(atualizar, 15_000);
    return () => window.clearInterval(timer);
  }, [atualizar]);

  return (
    <button
      type="button"
      onClick={atualizar}
      disabled={atualizando}
      className="af-btn-pill mx-auto gap-2"
    >
      <RefreshCw size={15} className={atualizando ? "animate-spin" : ""} />
      {atualizando ? "Verificando..." : "Verificar aprovação"}
    </button>
  );
}
