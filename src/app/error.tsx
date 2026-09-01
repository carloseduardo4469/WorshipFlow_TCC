"use client";

import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Falha não tratada na aplicação:", error); }, [error]);

  return (
    <main className="flex min-h-[70dvh] items-center justify-center bg-[#07101e] px-4 py-10 text-[#f5f3eb]">
      <section className="w-full max-w-md rounded-3xl border border-amber-300/35 bg-[#0d1b2e] p-6 text-center shadow-2xl sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-amber-300">Falha temporária</p>
        <h1 className="mt-3 font-serif text-3xl font-black">Não foi possível carregar esta página</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">Seus dados não foram apagados. Verifique a conexão e tente novamente.</p>
        <button type="button" onClick={reset} className="mt-6 min-h-11 w-full rounded-xl bg-amber-300 px-4 py-3 text-sm font-extrabold text-slate-950">Tentar novamente</button>
      </section>
    </main>
  );
}
