"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Falha no dashboard:", error); }, [error]);

  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-[760px] items-center justify-center py-8">
      <section role="alert" className="db-panel w-full p-6 text-center sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/40 bg-amber-300/10 text-amber-300"><AlertTriangle size={22} /></span>
        <p className="db-label mt-5 text-amber-300">Falha temporária</p>
        <h1 className="db-title mt-2 text-3xl text-paper">Não foi possível carregar esta área</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">A operação foi interrompida com segurança. Confira sua conexão e tente novamente.</p>
        <button type="button" onClick={reset} className="db-cta mt-6 w-full justify-center sm:w-auto"><RotateCcw size={16} /> Tentar novamente</button>
      </section>
    </div>
  );
}
