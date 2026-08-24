"use client";

import { useActionState } from "react";
import { atualizarUsuarioAdminAction } from "@/lib/actions/usuarios";
import { FormAlert } from "@/components/ui/FormAlert";
import type { Ministerio, Usuario } from "@/types/domain";

export function UsuarioRow({ usuario, ministerios }: { usuario: Usuario; ministerios: Ministerio[] }) {
  const [state, formAction, pending] = useActionState(atualizarUsuarioAdminAction, null);

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
