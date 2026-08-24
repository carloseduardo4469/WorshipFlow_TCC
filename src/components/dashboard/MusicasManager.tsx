"use client";

import { useEffect, useState } from "react";
import { Music2, Pencil, Plus, X } from "lucide-react";
import { removerMusicaAction } from "@/lib/actions/musicas";
import { MusicaForm } from "./MusicaForm";
import type { Ministerio, Musica } from "@/types/domain";

export function MusicasManager({ musicas, ministerios, isAdmin }: { musicas: Musica[]; ministerios: Ministerio[]; isAdmin: boolean }) {
  const [musicaAberta, setMusicaAberta] = useState<Musica | "nova" | null>(null);

  useEffect(() => {
    function fecharComEscape(event: KeyboardEvent) { if (event.key === "Escape") setMusicaAberta(null); }
    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, []);

  return <>
    <div className="db-music-panel db-card p-3 sm:p-4">
      {isAdmin && <div className="db-music-panel-actions"><button type="button" onClick={() => setMusicaAberta("nova")} className="db-cta"><Plus size={16} />Nova música</button></div>}
      {musicas.length === 0 ? <div className="db-empty db-empty-modern">Nenhuma música cadastrada ainda.</div> : <div className="overflow-x-auto"><table className="db-table w-full min-w-[680px] text-left text-sm"><thead className="bg-white/[0.035] text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3 font-medium">Título</th><th className="px-4 py-3 font-medium">Artista</th><th className="px-4 py-3 font-medium">Tom</th><th className="px-4 py-3 font-medium">BPM</th><th className="px-4 py-3 font-medium"><span className="sr-only">Ações</span></th></tr></thead><tbody className="divide-y divide-[color:rgba(148,163,184,0.1)]">{musicas.map((musica) => <tr key={musica.id}><td className="px-4 py-3.5 text-paper font-medium">{musica.linkCifra ? <a href={musica.linkCifra} target="_blank" rel="noreferrer" className="hover:text-cyan-300 hover:underline">{musica.titulo}</a> : musica.titulo}</td><td className="px-4 py-3.5 text-muted">{musica.artista ?? "—"}</td><td className="px-4 py-3.5 font-mono text-amber">{musica.tonalidade ?? "—"}</td><td className="px-4 py-3.5 text-muted">{musica.bpm ?? "—"}</td><td className="px-4 py-3.5 text-right">{isAdmin && <div className="db-row-actions"><button type="button" onClick={() => setMusicaAberta(musica)} className="db-btn-sm"><Pencil size={14} />Editar</button><form action={removerMusicaAction}><input type="hidden" name="id" value={musica.id} /><button type="submit" className="text-xs font-semibold text-red-400 hover:text-red-300">Excluir</button></form></div>}</td></tr>)}</tbody></table></div>}
    </div>

    {musicaAberta && <div role="presentation" className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#020817]/70 p-4 backdrop-blur-sm" onMouseDown={() => setMusicaAberta(null)}><section role="dialog" aria-modal="true" aria-labelledby="musica-dialog-title" className="db-member-modal my-auto relative w-full max-w-xl" onMouseDown={(event) => event.stopPropagation()}><button type="button" onClick={() => setMusicaAberta(null)} aria-label="Fechar formulário" className="db-icon-button absolute right-4 top-4 z-10 h-9 w-9"><X size={18} /></button><div className="px-6 pt-6 sm:px-8 sm:pt-8"><p className="db-label text-cyan-300">Biblioteca musical</p><h2 id="musica-dialog-title" className="db-title mt-2 pr-10 text-3xl text-paper">{musicaAberta === "nova" ? "Nova música" : "Editar música"}</h2></div><div className="p-2 sm:p-3"><MusicaForm musica={musicaAberta === "nova" ? undefined : musicaAberta} ministerios={ministerios} onCancel={() => setMusicaAberta(null)} /></div></section></div>}
  </>;
}
