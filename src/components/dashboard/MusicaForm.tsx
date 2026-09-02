"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { criarMusicaAction, atualizarMusicaAction } from "@/lib/actions/musicas";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { useDialogA11y } from "@/components/ui/useDialogA11y";
import { TONALIDADES_MAIORES, tomParaSelecao } from "@/lib/music/tonalidades";
import type { Musica } from "@/types/domain";
import { FORM_LIMITS } from "@/lib/validation/forms";

export function MusicaForm({
  musica,
  onCancel,
  onSaved,
}: {
  musica?: Musica;
  onCancel?: () => void;
  onSaved?: () => void;
}) {
  const action = musica ? atualizarMusicaAction : criarMusicaAction;
  const [state, formAction, pending] = useActionState(action, null);
  const [erroDispensado, setErroDispensado] = useState<typeof state>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const valoresAntesDoEnvio = useRef<Map<string, string[]>>(new Map());
  const router = useRouter();
  const erroAberto = Boolean(state?.error && state !== erroDispensado);
  const fecharErro = () => setErroDispensado(state);
  const errorDialogRef = useDialogA11y(erroAberto, fecharErro);
  const tonalidadeInicial = tomParaSelecao(musica?.tonalidade);

  useEffect(() => {
    if (!state?.error) return;
    const valores = valoresAntesDoEnvio.current;
    requestAnimationFrame(() => {
      formRef.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea").forEach((campo) => {
        if (!campo.name || (campo instanceof HTMLInputElement && campo.type === "hidden")) return;
        const salvos = valores.get(campo.name) ?? [];
        campo.value = salvos[0] ?? "";
      });
    });
  }, [state]);

  useEffect(() => {
    if (state?.success && onSaved) onSaved();
  }, [state, onSaved]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(event) => {
        const valores = new Map<string, string[]>();
        new FormData(event.currentTarget).forEach((valor, nome) => {
          const atuais = valores.get(nome) ?? [];
          atuais.push(String(valor));
          valores.set(nome, atuais);
        });
        valoresAntesDoEnvio.current = valores;
      }}
      className="db-panel flex max-w-lg flex-col gap-5 p-6 text-left sm:p-8"
    >
      {musica && <input type="hidden" name="id" value={musica.id} />}
      {onSaved && <input type="hidden" name="preservarPesquisa" value="true" />}

      <Input label="Título" name="titulo" defaultValue={musica?.titulo} maxLength={FORM_LIMITS.musicaTitulo} required />
      <Input label="Artista" name="artista" defaultValue={musica?.artista ?? ""} maxLength={FORM_LIMITS.artista} required />

      <div className="flex w-full flex-col gap-2 sm:w-48">
        <label htmlFor="tonalidade" className="db-label">
          Tonalidade
        </label>
        <Select
          id="tonalidade"
          name="tonalidade"
          defaultValue={tonalidadeInicial}
          aria-label="Tonalidade"
          options={[
            { value: "", label: "Selecione o tom" },
            ...TONALIDADES_MAIORES.map((tonalidade) => ({
              value: tonalidade,
              label: tonalidade,
            })),
          ]}
        />
      </div>

      <p className="text-xs leading-relaxed text-muted">
        Só tons maiores. Música em tom menor? Escolha o tom maior relativo (ex.: E) e a cifra abre na relativa menor (C#m).
      </p>

      <div className="db-form-actions mt-2 flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => onCancel ? onCancel() : router.back()}>
          Cancelar
        </Button>
      </div>

      {state?.error && erroAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020817]/70 p-4 backdrop-blur-sm" onMouseDown={fecharErro}>
          <section ref={errorDialogRef} tabIndex={-1} role="alertdialog" aria-modal="true" aria-labelledby="erro-musica-titulo" className="db-panel w-full max-w-md p-5 text-left shadow-2xl sm:p-7" onMouseDown={(event) => event.stopPropagation()}>
            <p className="db-label text-amber-300">Verifique a música</p>
            <h2 id="erro-musica-titulo" className="db-title mt-2 text-2xl text-paper">Não foi possível salvar</h2>
            <div className="mt-4"><FormAlert>{state.error}</FormAlert></div>
            <button type="button" onClick={fecharErro} className="db-btn-sm mt-6 w-full px-4 py-2.5 text-sm font-semibold sm:w-auto" autoFocus>Entendi</button>
          </section>
        </div>
      )}
    </form>
  );
}
