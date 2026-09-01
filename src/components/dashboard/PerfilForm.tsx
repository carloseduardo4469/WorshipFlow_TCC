"use client";

import { ChangeEvent, FormEvent, useActionState, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { atualizarPerfilAction, excluirMinhaContaAction } from "@/lib/actions/usuarios";
import { Input, CheckboxGroup } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import type { Usuario } from "@/types/domain";
import {
  FORM_LIMITS,
  NAME_ALLOWED_PATTERN,
  normalizePersonName,
  normalizePhone,
} from "@/lib/validation/forms";

const OPCOES_HABILIDADES = [
  { value: "violao", label: "Violão" },
  { value: "guitarra", label: "Guitarra" },
  { value: "bateria", label: "Bateria" },
  { value: "teclado", label: "Teclado" },
  { value: "baixo", label: "Baixo" },
  { value: "voz-principal", label: "Voz principal" },
  { value: "voz-secundaria", label: "Voz secundária" },
];

const FOTO_TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const FOTO_TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;
const FOTO_DIMENSAO_MAXIMA = 512;
const FOTO_ERRO_TAMANHO = "A foto precisa ter no máximo 5 MB.";
const FOTO_ERRO_TIPO = "Use uma imagem JPG, PNG ou WebP.";

async function otimizarFoto(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const imagem = await new Promise<HTMLImageElement>((resolve, reject) => {
      const elemento = new Image();
      elemento.onload = () => resolve(elemento);
      elemento.onerror = () => reject(new Error("Imagem inválida"));
      elemento.src = url;
    });
    const escala = Math.min(1, FOTO_DIMENSAO_MAXIMA / Math.max(imagem.naturalWidth, imagem.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(imagem.naturalWidth * escala));
    canvas.height = Math.max(1, Math.round(imagem.naturalHeight * escala));
    const contexto = canvas.getContext("2d");
    if (!contexto) return file;
    contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    return blob ? new File([blob], "foto-perfil.jpg", { type: "image/jpeg", lastModified: Date.now() }) : file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function PerfilForm({ usuario }: { usuario: Usuario }) {
  const [state, formAction, pending] = useActionState(atualizarPerfilAction, null);
  const [deleteState, deleteAction, deletePending] = useActionState(excluirMinhaContaAction, null);
  const [preview, setPreview] = useState(usuario.fotoPerfilUrl);
  const [fileName, setFileName] = useState("");
  const [bottomMessage, setBottomMessage] = useState("");
  const [confirmandoExcluirConta, setConfirmandoExcluirConta] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!bottomMessage) return;
    const timeoutId = window.setTimeout(() => setBottomMessage(""), 4500);
    return () => window.clearTimeout(timeoutId);
  }, [bottomMessage]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function showBottomMessage(message: string) {
    setBottomMessage(message);
  }

  function clearSelectedFile(input: HTMLInputElement) {
    input.value = "";
    setFileName("");
    setPreview(usuario.fotoPerfilUrl);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }

  function validatePhoto(file: File) {
    if (!FOTO_TIPOS_PERMITIDOS.includes(file.type)) return FOTO_ERRO_TIPO;
    if (file.size > FOTO_TAMANHO_MAXIMO_BYTES) return FOTO_ERRO_TAMANHO;
    return "";
  }

  async function updatePreview(event: ChangeEvent<HTMLInputElement>) {
    setBottomMessage("");
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validatePhoto(file);
    if (validationError) {
      clearSelectedFile(event.target);
      showBottomMessage(validationError);
      return;
    }

    let fotoOtimizada: File;
    try {
      fotoOtimizada = await otimizarFoto(file);
      const arquivos = new DataTransfer();
      arquivos.items.add(fotoOtimizada);
      event.target.files = arquivos.files;
    } catch {
      clearSelectedFile(event.target);
      showBottomMessage("Não foi possível preparar essa foto. Escolha outra imagem.");
      return;
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const objectUrl = URL.createObjectURL(fotoOtimizada);
    previewUrlRef.current = objectUrl;
    setFileName(file.name);
    setPreview(objectUrl);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const fileInput = event.currentTarget.elements.namedItem("fotoPerfil");
    if (!(fileInput instanceof HTMLInputElement)) return;

    const file = fileInput.files?.[0];
    if (!file) return;

    const validationError = validatePhoto(file);
    if (!validationError) return;

    event.preventDefault();
    clearSelectedFile(fileInput);
    showBottomMessage(validationError);
  }

  return (
    <>
      <form action={formAction} onSubmit={handleSubmit} className="db-panel db-profile-form flex max-w-lg flex-col gap-5 p-6 text-left sm:p-8">
      <div className="db-profile-photo-field flex items-center gap-4">
        {preview ? (
          <img src={preview} alt="Prévia da foto de perfil" className="db-profile-avatar h-16 w-16 rounded-full object-cover ring-2 ring-cyan-300/45" />
        ) : (
          <span className="db-profile-avatar flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#e9d375] to-[#5ccee0] text-lg font-bold text-[#07101e]">
            {usuario.nome.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="db-profile-photo-content min-w-0">
          <label htmlFor="fotoPerfil" className="db-label">Foto de perfil</label>
          <div className="db-profile-upload-row mt-2 flex min-w-0 flex-wrap items-center gap-3">
            <input id="fotoPerfil" name="fotoPerfil" type="file" accept="image/jpeg,image/png,image/webp" onChange={updatePreview} className="sr-only" />
            <label htmlFor="fotoPerfil" className="db-file-button shrink-0">
              <Upload size={15} /> Adicionar foto de perfil
            </label>
          </div>
        </div>
      </div>
      <Input
        label="Nome"
        name="nome"
        defaultValue={usuario.nome}
        required
        maxLength={FORM_LIMITS.nomePessoa}
        pattern={NAME_ALLOWED_PATTERN}
        onInput={(event) => {
          event.currentTarget.value = normalizePersonName(event.currentTarget.value);
        }}
      />
      <Input
        label="Telefone"
        name="telefone"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={FORM_LIMITS.telefone}
        pattern="[0-9]{11}"
        title="Informe DDD + número, com 11 dígitos."
        defaultValue={usuario.telefone ?? ""}
        onInput={(event) => {
          event.currentTarget.value = normalizePhone(event.currentTarget.value);
        }}
      />
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

      <div className="db-form-actions mt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
      </form>
      <form id="delete-account-form" action={deleteAction} className="db-panel mt-5 flex max-w-lg flex-col gap-4 border border-red-300/20 p-6 text-left sm:p-8">
      <div>
        <h2 className="font-semibold text-paper">Excluir conta</h2>
        <p className="db-hint mt-1">Essa ação é permanente e remove seu acesso ao WorshipFlow.</p>
      </div>
      <Input label='Digite "excluirminhaconta" para confirmar' name="confirmacao" autoComplete="off" maxLength={FORM_LIMITS.confirmacaoExclusao} required />
      {deleteState?.error && <FormAlert>{deleteState.error}</FormAlert>}
      <Button type="button" onClick={() => setConfirmandoExcluirConta(true)} disabled={deletePending} className="!bg-red-500/80 hover:!bg-red-500">
        {deletePending ? "Excluindo..." : "Excluir minha conta"}
      </Button>
      </form>
      <DeleteConfirmDialog
        open={confirmandoExcluirConta}
        title="Excluir sua conta?"
        description={<>Seu acesso e seus dados pessoais serão removidos permanentemente. Esta ação <strong>não poderá ser desfeita</strong>.</>}
        onCancel={() => setConfirmandoExcluirConta(false)}
      >
        <button type="submit" form="delete-account-form" disabled={deletePending} onClick={() => setConfirmandoExcluirConta(false)} className="delete-confirm-danger">
          {deletePending ? "Excluindo..." : "Sim, excluir conta"}
        </button>
      </DeleteConfirmDialog>
      {bottomMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-red-300/30 bg-[#190d14]/95 px-4 py-3 text-sm font-semibold text-red-100 shadow-2xl shadow-black/40 backdrop-blur sm:bottom-6"
        >
          {bottomMessage}
        </div>
      )}
    </>
  );
}
