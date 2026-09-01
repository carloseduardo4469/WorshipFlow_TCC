"use client";

import { useActionState, useState } from "react";
import {
  atualizarUsuarioAdminAction,
  removerUsuarioAdminAction,
} from "@/lib/actions/usuarios";
import { FormAlert } from "@/components/ui/FormAlert";
import { Select } from "@/components/ui/Select";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import type { Usuario } from "@/types/domain";

export function UsuarioRow({ usuario }: { usuario: Usuario }) {
  const [state, formAction, pending] = useActionState(atualizarUsuarioAdminAction, null);
  const [deleteState, deleteAction, deletePending] = useActionState(removerUsuarioAdminAction, null);
  const [isSuspended, setIsSuspended] = useState(usuario.isSuspended);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  return (
    <>
    <form
      action={formAction}
      className={`db-card db-user-account flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
        isSuspended ? "db-user-account-suspended" : "db-user-account-active"
      }`}
    >
      <input type="hidden" name="id" value={usuario.id} />

      <div className="min-w-0">
        <p className="truncate font-medium text-paper">{usuario.nome}</p>
        <p className="truncate text-xs text-muted">{usuario.email}</p>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-3 sm:justify-end">
        <Select
          name="perfil"
          defaultValue={usuario.perfil}
          className="db-select w-28"
          aria-label={`Perfil de ${usuario.nome}`}
        >
          <option value="MEMBRO">Membro</option>
          <option value="ADMIN">Admin</option>
        </Select>

        <label className={`relative flex w-[116px] shrink-0 cursor-pointer items-center gap-2 text-xs font-bold transition-colors ${isSuspended ? "text-orange-300" : "text-emerald-300"}`}>
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
            className={`db-status-toggle relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
              isSuspended
                ? "border-orange-300/70 bg-orange-400/20"
                : "border-emerald-300/70 bg-emerald-400/20"
            }`}
          />
          <span
            className={`pointer-events-none absolute left-0.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-muted transition-transform ${
              isSuspended ? "translate-x-4 bg-orange-200" : "bg-emerald-200"
            }`}
          />
          <span className="w-[68px]">{isSuspended ? "Suspensa" : "Liberada"}</span>
        </label>

        <button type="submit" disabled={pending} className="db-btn-sm">
          {pending ? "..." : "Salvar"}
        </button>

        {usuario.perfil !== "ADMIN" && (
          <button
            type="button"
            disabled={pending || deletePending}
            onClick={() => setConfirmandoExclusao(true)}
            className="db-danger-button text-xs font-semibold text-red-400 hover:text-red-300 disabled:pointer-events-none disabled:opacity-50"
          >
            {deletePending ? "Removendo..." : "Remover"}
          </button>
        )}
      </div>

      {(state?.error || deleteState?.error) && (
        <div className="w-full sm:basis-full">
          <FormAlert>{state?.error ?? deleteState?.error}</FormAlert>
        </div>
      )}
    </form>
    <DeleteConfirmDialog
      open={confirmandoExclusao}
      title="Excluir usuário?"
      description={<>A conta de <strong>{usuario.nome}</strong> e seus dados serão removidos permanentemente do WorshipFlow.</>}
      onCancel={() => setConfirmandoExclusao(false)}
    >
      <form action={deleteAction} onSubmit={() => setConfirmandoExclusao(false)}>
        <input type="hidden" name="id" value={usuario.id} />
        <button type="submit" disabled={deletePending} className="delete-confirm-danger w-full">
          {deletePending ? "Excluindo..." : "Sim, excluir"}
        </button>
      </form>
    </DeleteConfirmDialog>
    </>
  );
}
