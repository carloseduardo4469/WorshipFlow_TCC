"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ExternalLink, Loader2, Music2, Users, X } from "lucide-react";
import { buscarMusicasPorIds } from "@/lib/actions/musicas";
import { normalizarEscala } from "@/lib/escalas/normalize";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Escala, Musica, Usuario } from "@/types/domain";

const NOMES_FUNCOES: Record<string, string> = {
  violao: "Violão",
  guitarra: "Guitarra",
  bateria: "Bateria",
  teclado: "Teclado",
  baixo: "Baixo",
  "voz-principal": "Voz principal",
  "voz-secundaria": "Voz secundária",
};

function formatarData(iso: string | null) {
  if (!iso) return "Não informada";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatarFuncoes(valor: string) {
  return [...new Set(valor.split(",").map((item) => item.trim()).filter(Boolean))]
    .map((item) => NOMES_FUNCOES[item] ?? item)
    .join(" · ");
}

export function EscalaDetailsDialog({
  escala: escalaOriginal,
  usuarios,
  onClose,
}: {
  escala: Escala;
  usuarios: Usuario[];
  onClose: () => void;
}) {
  const escala = useMemo(() => normalizarEscala(escalaOriginal), [escalaOriginal]);
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [carregando, setCarregando] = useState(escala.musicaIds.length > 0);
  const [erro, setErro] = useState(false);

  const nomesPorId = useMemo(
    () => new Map(usuarios.map((usuario) => [usuario.id, usuario.nome])),
    [usuarios]
  );
  const funcoesPorUsuario = new Map(escala.funcoesUsuarios.map((item) => [item.usuarioId, item.funcao]));
  const tonsPorMusica = new Map(escala.tonalidadesMusicas.map((item) => [item.musicaId, item.tonalidade]));

  useEffect(() => {
    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, [onClose]);

  useEffect(() => {
    if (escala.musicaIds.length === 0) {
      setMusicas([]);
      setCarregando(false);
      return;
    }

    let ativo = true;
    setCarregando(true);
    setErro(false);
    buscarMusicasPorIds(escala.musicaIds)
      .then((resultado) => {
        if (!ativo) return;
        const porId = new Map(resultado.map((musica) => [musica.id, musica]));
        setMusicas(escala.musicaIds.map((id) => porId.get(id)).filter((item): item is Musica => Boolean(item)));
      })
      .catch(() => {
        if (ativo) setErro(true);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => { ativo = false; };
  }, [escala]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#020817]/70 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="escala-detalhes-titulo"
        className="db-member-modal db-schedule-dialog relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain p-5 sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label="Fechar detalhes" className="db-icon-button absolute right-4 top-4 z-10 h-9 w-9">
          <X size={18} />
        </button>

        <div className="pr-11">
          <p className="db-label db-schedule-kicker">Detalhes da escala</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 id="escala-detalhes-titulo" className="db-title db-schedule-dialog-title text-3xl leading-tight text-paper sm:text-4xl">
              {escala.titulo}
            </h2>
            <StatusBadge status={escala.status} />
          </div>
        </div>

        <dl className="db-schedule-facts mt-6 grid gap-3 sm:grid-cols-2">
          <div className="db-schedule-fact">
            <dt><CalendarDays size={15} /> Data</dt>
            <dd>{formatarData(escala.dataEscala)}</dd>
          </div>
        </dl>

        {escala.observacoes && (
          <section className="db-schedule-section mt-5">
            <h3>Observações</h3>
            <p className="whitespace-pre-wrap">{escala.observacoes}</p>
          </section>
        )}

        <section className="db-schedule-section mt-5">
          <h3><Users size={15} /> Equipe ({escala.usuarioIds.length})</h3>
          {escala.usuarioIds.length === 0 ? (
            <p>Nenhum membro escalado.</p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {escala.usuarioIds.map((id) => {
                const funcao = formatarFuncoes(funcoesPorUsuario.get(id) ?? "");
                return (
                  <li key={id} className="db-schedule-person">
                    <strong>{nomesPorId.get(id) ?? "Membro não encontrado"}</strong>
                    {funcao && <span>{funcao}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="db-schedule-section mt-5">
          <h3><Music2 size={15} /> Músicas ({escala.musicaIds.length})</h3>
          {carregando ? (
            <p className="mt-3 flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Carregando músicas...</p>
          ) : erro ? (
            <p className="mt-3 text-red-400">Não foi possível carregar as músicas.</p>
          ) : escala.musicaIds.length === 0 ? (
            <p className="mt-3">Nenhuma música adicionada.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {musicas.map((musica, index) => (
                <li key={musica.id} className="db-schedule-song">
                  <span className="db-schedule-song-index">{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <strong className="block break-words">{musica.titulo}</strong>
                    {musica.artista && <small className="block break-words">{musica.artista}</small>}
                  </span>
                  <span className="db-schedule-tone">{tonsPorMusica.get(musica.id) ?? musica.tonalidade ?? "—"}</span>
                  {musica.linkCifra && (
                    <a href={musica.linkCifra} target="_blank" rel="noreferrer" aria-label={`Abrir cifra de ${musica.titulo}`}>
                      <ExternalLink size={16} /> <span className="hidden sm:inline">Cifra</span>
                    </a>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      </section>
    </div>
  );
}
