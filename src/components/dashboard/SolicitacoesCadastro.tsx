"use client";

import { useActionState, useState } from "react";
import { ArrowUpRight, CalendarClock, Mail, Phone, UserRound, UsersRound, X } from "lucide-react";
import {
  aprovarSolicitacaoCadastroAction,
  negarSolicitacaoCadastroAction,
} from "@/lib/actions/usuarios";
import { FormAlert } from "@/components/ui/FormAlert";
import { useDialogA11y } from "@/components/ui/useDialogA11y";
import type { Usuario } from "@/types/domain";

function formatarData(data: string) {
  const valor = new Date(data);
  if (Number.isNaN(valor.getTime())) return "Data não informada";
  return valor.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function SolicitacaoItem({ usuario }: { usuario: Usuario }) {
  const [approvalState, approvalAction, approvalPending] = useActionState(
    aprovarSolicitacaoCadastroAction,
    null
  );
  const [denialState, denialAction, denialPending] = useActionState(
    negarSolicitacaoCadastroAction,
    null
  );
  const pending = approvalPending || denialPending;
  const error = approvalState?.error ?? denialState?.error;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[.035] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-300">
          <UserRound size={21} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-paper">{usuario.nome}</h3>
          <p className="mt-1 flex items-center gap-2 break-all text-xs text-muted">
            <Mail size={13} aria-hidden="true" /> {usuario.email}
          </p>
          <p className="mt-1.5 flex items-center gap-2 text-xs text-muted">
            <Phone size={13} aria-hidden="true" /> {usuario.telefone || "Telefone não informado"}
          </p>
          <p className="mt-1.5 flex items-center gap-2 text-xs text-muted">
            <CalendarClock size={13} aria-hidden="true" /> Solicitado em {formatarData(usuario.createdAt)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <form action={approvalAction}>
            <input type="hidden" name="id" value={usuario.id} />
            <button
              type="submit"
              disabled={pending}
              aria-label={`Aceitar cadastro de ${usuario.nome}`}
              title="Aceitar entrada"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/45 bg-emerald-400/10 text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-wait disabled:opacity-45"
            >
              <ArrowUpRight size={19} aria-hidden="true" />
            </button>
          </form>
          <form action={denialAction}>
            <input type="hidden" name="id" value={usuario.id} />
            <button
              type="submit"
              disabled={pending}
              aria-label={`Negar cadastro de ${usuario.nome}`}
              title="Negar entrada e excluir solicitação"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/45 bg-red-400/10 text-red-300 transition hover:bg-red-400/20 disabled:cursor-wait disabled:opacity-45"
            >
              <X size={19} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
      {error && <div className="mt-3"><FormAlert>{error}</FormAlert></div>}
    </article>
  );
}

export function SolicitacoesCadastro({ usuarios }: { usuarios: Usuario[] }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useDialogA11y(open, () => setOpen(false));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Solicitações de cadastro: ${usuarios.length} pendente${usuarios.length === 1 ? "" : "s"}`}
        className="db-icon-button relative h-12 w-12 border-cyan-300/35 bg-cyan-300/10 text-cyan-200"
      >
        <UsersRound size={21} aria-hidden="true" />
        {usuarios.length > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#0a2238] bg-red-500 px-1 text-[10px] font-black leading-none text-white">
            {usuarios.length > 99 ? "99+" : usuarios.length}
          </span>
        )}
      </button>

      {open && (
        <div
          role="presentation"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#020817]/75 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={() => setOpen(false)}
        >
          <section
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="solicitacoes-cadastro-titulo"
            className="db-member-modal relative max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain p-5 sm:p-7"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar solicitações"
              className="db-icon-button absolute right-4 top-4 h-9 w-9"
            >
              <X size={18} aria-hidden="true" />
            </button>

            <p className="db-label text-cyan-300">Controle de acesso</p>
            <h2 id="solicitacoes-cadastro-titulo" className="db-title mt-2 pr-12 text-3xl text-paper">
              Solicitações de cadastro
            </h2>
            <p className="mt-2 pr-8 text-sm font-medium text-muted">
              Confira os dados antes de liberar ou negar a entrada no WorshipFlow.
            </p>

            <div className="mt-6 grid gap-3">
              {usuarios.length === 0 ? (
                <div className="db-empty db-empty-modern">Nenhuma solicitação pendente.</div>
              ) : usuarios.map((usuario) => <SolicitacaoItem key={usuario.id} usuario={usuario} />)}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
