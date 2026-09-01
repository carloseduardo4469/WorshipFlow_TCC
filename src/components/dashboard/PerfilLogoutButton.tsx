"use client";

import { useState } from "react";
import { LogOut, X } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { useDialogA11y } from "@/components/ui/useDialogA11y";

export function PerfilLogoutButton() {
  const [aberto, setAberto] = useState(false);
  const dialogRef = useDialogA11y(aberto, () => setAberto(false));

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Sair da conta"
        title="Sair da conta"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-red-400/40 bg-red-500/10 text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
      >
        <LogOut size={18} />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#020817]/75 p-4 backdrop-blur-sm" onMouseDown={() => setAberto(false)}>
          <section ref={dialogRef} tabIndex={-1} role="alertdialog" aria-modal="true" aria-labelledby="sair-conta-titulo" aria-describedby="sair-conta-descricao" className="db-member-modal relative w-full max-w-sm p-5 text-left sm:p-7" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setAberto(false)} aria-label="Fechar" className="db-icon-button absolute right-4 top-4 h-9 w-9"><X size={16} /></button>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/15 text-red-400"><LogOut size={20} /></div>
            <h2 id="sair-conta-titulo" className="db-title mt-4 pr-10 text-2xl text-paper">Sair da conta?</h2>
            <p id="sair-conta-descricao" className="mt-2 text-sm leading-6 text-muted">Você precisará informar seu email e senha para entrar novamente.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setAberto(false)} className="db-ghost px-4 py-2.5 text-sm font-semibold">Cancelar</button>
              <form action={logoutAction}>
                <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-400"><LogOut size={16} /> Sair</button>
              </form>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
