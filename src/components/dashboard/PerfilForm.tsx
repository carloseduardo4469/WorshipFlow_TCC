"use client";

import { ChangeEvent, useActionState, useState } from "react";
import { atualizarPerfilAction } from "@/lib/actions/usuarios";
import { Input, CheckboxGroup } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import type { Usuario } from "@/types/domain";

const OPCOES_HABILIDADES = [
  { value: "violao", label: "Violão" },
  { value: "guitarra", label: "Guitarra" },
  { value: "bateria", label: "Bateria" },
  { value: "teclado", label: "Teclado" },
  { value: "trompete", label: "Trompete" },
  { value: "baixo", label: "Baixo" },
  { value: "voz-principal", label: "Voz principal" },
  { value: "voz-secundaria", label: "Voz secundária" },
];

export function PerfilForm({ usuario }: { usuario: Usuario }) {
  const [state, formAction, pending] = useActionState(atualizarPerfilAction, null);
  const [preview, setPreview] = useState(usuario.fotoPerfilUrl);

  function updatePreview(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  return (
    <form action={formAction} className="db-panel flex max-w-lg flex-col gap-5 p-6 text-left sm:p-8">
      <div className="flex items-center gap-4">
        {preview ? (
          <img src={preview} alt="Prévia da foto de perfil" className="h-16 w-16 rounded-full object-cover ring-2 ring-cyan-300/45" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#e9d375] to-[#5ccee0] text-lg font-bold text-[#07101e]">
            {usuario.nome.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <label htmlFor="fotoPerfil" className="db-label">Foto de perfil</label>
          <input id="fotoPerfil" name="fotoPerfil" type="file" accept="image/jpeg,image/png,image/webp" onChange={updatePreview} className="db-file-input mt-2 block w-full text-sm" />
          <p className="db-hint mt-1">JPG, PNG ou WebP, com até 1 MB.</p>
        </div>
      </div>
      <Input label="Nome" name="nome" defaultValue={usuario.nome} required />
      <Input label="Telefone" name="telefone" defaultValue={usuario.telefone ?? ""} />
      <Input label="Instrumento principal" name="instrumentoPrincipal" defaultValue={usuario.instrumentoPrincipal ?? ""} placeholder="Ex.: Violão" />
      <CheckboxGroup
        label="Instrumentos"
        name="habilidades"
        options={OPCOES_HABILIDADES}
        defaultSelected={(usuario.habilidades ?? "")
          .split(",")
          .map((habilidade) => habilidade.trim())
          .filter(Boolean)}
      />

      {state?.error && <FormAlert>{state.error}</FormAlert>}
      {state?.success && <FormAlert kind="success">Perfil atualizado.</FormAlert>}

      <div className="mt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
