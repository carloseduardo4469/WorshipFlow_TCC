"use client";

import { useActionState, useEffect, useState } from "react";
import { Music2, X } from "lucide-react";
import { criarMusicaNaEscalaAction } from "@/lib/actions/musicas";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { useDialogA11y } from "@/components/ui/useDialogA11y";
import { TONALIDADES_MAIORES } from "@/lib/music/tonalidades";
import { FORM_LIMITS } from "@/lib/validation/forms";
import type { Musica } from "@/types/domain";

export function NovaMusicaEscalaDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (musica: Musica) => void }) {
  const [state, formAction, pending] = useActionState(criarMusicaNaEscalaAction, null);
  const [titulo, setTitulo] = useState("");
  const [artista, setArtista] = useState("");
  const [tonalidade, setTonalidade] = useState("");
  const dialogRef = useDialogA11y(true, onClose);

  useEffect(() => {
    if (state?.success && state.musica) onCreated(state.musica);
  }, [state, onCreated]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-[#020817]/75 p-3 backdrop-blur-md" onMouseDown={onClose}>
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="nova-musica-escala-titulo" className="db-member-modal relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto p-5 sm:p-7" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} className="db-icon-button absolute right-4 top-4 h-9 w-9" aria-label="Fechar"><X size={17} /></button>
        <p className="db-label text-cyan-300">Catálogo de músicas</p>
        <h2 id="nova-musica-escala-titulo" className="db-title mt-2 pr-12 text-2xl text-paper">Nova música</h2>
        <p className="mt-2 text-sm text-muted">Cadastre a música e ela será selecionada nesta escala.</p>

        <form action={formAction} className="mt-5 flex flex-col gap-4">
          <Input label="Título" name="titulo" value={titulo} onChange={(event) => setTitulo(event.target.value)} maxLength={FORM_LIMITS.musicaTitulo} required />
          <Input label="Artista" name="artista" value={artista} onChange={(event) => setArtista(event.target.value)} maxLength={FORM_LIMITS.artista} required />
          <div className="flex flex-col gap-2">
            <label className="db-label" htmlFor="nova-musica-tonalidade">Tonalidade</label>
            <Select id="nova-musica-tonalidade" name="tonalidade" value={tonalidade} onValueChange={setTonalidade} options={[
              { value: "", label: "Selecione o tom" },
              ...TONALIDADES_MAIORES.map((tom) => ({ value: tom, label: tom })),
            ]} />
          </div>
          {state?.error && <FormAlert>{state.error}</FormAlert>}
          <div className="db-form-actions mt-2">
            <Button type="submit" disabled={pending}><Music2 size={16} /> {pending ? "Adicionando..." : "Adicionar música"}</Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
