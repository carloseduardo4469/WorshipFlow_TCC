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
      className="flex flex-col gap-3 rounded-lg border border-paper/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <input type="hidden" name="id" value={usuario.id} />

      <div className="min-w-0">
        <p className="truncate text-sm text-paper">{usuario.nome}</p>
        <p className="truncate text-xs text-muted">{usuario.email}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          name="perfil"
          defaultValue={usuario.perfil}
          className="rounded-md border border-paper/20 bg-ink px-2 py-1.5 text-xs text-paper focus:border-amber focus:outline-none"
        >
          <option value="MEMBRO">Membro</option>
          <option value="ADMIN">Admin</option>
        </select>

        <select
          name="statusMinisterio"
          defaultValue={usuario.statusMinisterio}
          className="rounded-md border border-paper/20 bg-ink px-2 py-1.5 text-xs text-paper focus:border-amber focus:outline-none"
        >
          <option value="ATIVO">Ativo</option>
          <option value="INATIVO">Inativo</option>
        </select>

        <select
          name="ministerioId"
          defaultValue={usuario.ministerioId ?? ""}
          className="rounded-md border border-paper/20 bg-ink px-2 py-1.5 text-xs text-paper focus:border-amber focus:outline-none"
        >
          <option value="">Sem ministério</option>
          {ministerios.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-amber px-3 py-1.5 text-xs font-medium text-ink hover:bg-amber/90 disabled:opacity-50"
        >
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
