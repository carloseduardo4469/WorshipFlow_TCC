"use client";

import { useActionState, useState } from "react";
import { atualizarUsuarioAdminAction } from "@/lib/actions/usuarios";
import { FormAlert } from "@/components/ui/FormAlert";
import type { Ministerio, Usuario } from "@/types/domain";

export function UsuarioRow({ usuario, ministerios }: { usuario: Usuario; ministerios: Ministerio[] }) {
  const [state, formAction, pending] = useActionState(atualizarUsuarioAdminAction, null);
  const [isSuspended, setIsSuspended] = useState(usuario.isSuspended);

  return (
    <form
      action={formAction}
      className="db-card flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <input type="hidden" name="id" value={usuario.id} />

      <div className="min-w-0">
        <p className="truncate font-medium text-paper">{usuario.nome}</p>
        <p className="truncate text-xs text-muted">{usuario.email}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          name="perfil"
          defaultValue={usuario.perfil}
          className="db-select w-28"
        >
          <option value="MEMBRO">Membro</option>
          <option value="ADMIN">Admin</option>
        </select>

        <label className="relative flex w-[100px] shrink-0 cursor-pointer items-center gap-2 text-xs font-semibold text-muted transition-colors hover:text-paper">
          <input
            type="checkbox"
            name="isSuspended"
            value="true"
            checked={isSuspended}
            onChange={(event) => setIsSuspended(event.target.checked)}
            aria-label={`Suspender conta de ${usuario.nome}`}
            className="peer sr-only"
          />
          <span
            className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
              isSuspended
                ? "border-amber-300/60 bg-amber-300/25"
                : "border-white/15 bg-white/10"
            }`}
          />
          <span
            className={`pointer-events-none absolute left-0.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-muted transition-transform ${
              isSuspended ? "translate-x-4 bg-amber-200" : ""
            }`}
          />
          <span className="w-[52px]">{isSuspended ? "Suspensa" : "Ativa"}</span>
        </label>

        <select
          name="statusMinisterio"
          defaultValue={usuario.statusMinisterio}
          className="db-select w-28"
        >
          <option value="ATIVO">Ativo</option>
          <option value="INATIVO">Inativo</option>
        </select>

        <select
          name="ministerioId"
          defaultValue={usuario.ministerioId ?? ""}
          className="db-select w-40"
        >
          <option value="">Sem ministério</option>
          {ministerios.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>

        <button type="submit" disabled={pending} className="db-btn-sm">
          {pending ? "..." : "Salvar"}
        </button>
      </div>

      {state?.error && (
        <div className="w-full sm:basis-full">
          <FormAlert>{state.error}</FormAlert>
        </div>
      )}
    </form>
  );
}
