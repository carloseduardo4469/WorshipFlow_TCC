"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Users, X } from "lucide-react";
import { EscalaDetailsDialog } from "./EscalaDetailsDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { normalizarEscalas } from "@/lib/escalas/normalize";
import type { Escala, Usuario } from "@/types/domain";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function dataIso(ano: number, mes: number, dia: number) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function tituloMes(ano: number, mes: number) {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(ano, mes, 1)));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function dataCompleta(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export function HistoricoCalendar({
  escalas: escalasOriginais,
  usuarios,
  hoje,
}: {
  escalas: Escala[];
  usuarios: Usuario[];
  hoje: string;
}) {
  const [anoHoje, mesHoje] = hoje.split("-").map(Number);
  const [mesVisivel, setMesVisivel] = useState({ ano: anoHoje, mes: mesHoje - 1 });
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [escalaSelecionada, setEscalaSelecionada] = useState<Escala | null>(null);
  const escalas = useMemo(() => normalizarEscalas(escalasOriginais), [escalasOriginais]);

  const escalasPorDia = useMemo(() => {
    const mapa = new Map<string, Escala[]>();
    for (const escala of escalas) {
      if (!escala.dataEscala) continue;
      const atuais = mapa.get(escala.dataEscala) ?? [];
      atuais.push(escala);
      mapa.set(escala.dataEscala, atuais);
    }
    return mapa;
  }, [escalas]);

  const primeiroDia = new Date(Date.UTC(mesVisivel.ano, mesVisivel.mes, 1)).getUTCDay();
  const quantidadeDias = new Date(Date.UTC(mesVisivel.ano, mesVisivel.mes + 1, 0)).getUTCDate();
  const celulas = Array.from({ length: Math.ceil((primeiroDia + quantidadeDias) / 7) * 7 }, (_, indice) => {
    const dia = indice - primeiroDia + 1;
    return dia >= 1 && dia <= quantidadeDias ? dia : null;
  });
  const escalasDoDia = diaSelecionado ? escalasPorDia.get(diaSelecionado) ?? [] : [];

  function mudarMes(delta: number) {
    setMesVisivel((atual) => {
      const data = new Date(Date.UTC(atual.ano, atual.mes + delta, 1));
      return { ano: data.getUTCFullYear(), mes: data.getUTCMonth() };
    });
    setDiaSelecionado(null);
  }

  return (
    <>
      <section className="db-card db-history-calendar p-3 sm:p-5">
        <header className="db-history-calendar-header">
          <button type="button" onClick={() => mudarMes(-1)} className="db-icon-button" aria-label="Mês anterior">
            <ChevronLeft size={19} />
          </button>
          <div className="min-w-0 text-center">
            <p className="db-label">Calendário de escalas</p>
            <h2 className="db-history-month mt-1">{tituloMes(mesVisivel.ano, mesVisivel.mes)}</h2>
          </div>
          <button type="button" onClick={() => mudarMes(1)} className="db-icon-button" aria-label="Próximo mês">
            <ChevronRight size={19} />
          </button>
        </header>

        <div className="db-history-weekdays" aria-hidden="true">
          {DIAS_SEMANA.map((dia) => <span key={dia}>{dia}</span>)}
        </div>

        <div className="db-history-grid">
          {celulas.map((dia, indice) => {
            if (!dia) return <div key={`vazio-${indice}`} className="db-history-day db-history-day-empty" />;
            const iso = dataIso(mesVisivel.ano, mesVisivel.mes, dia);
            const escalasNaData = escalasPorDia.get(iso) ?? [];
            const preenchido = escalasNaData.length > 0;
            return (
              <button
                key={iso}
                type="button"
                disabled={!preenchido}
                onClick={() => preenchido && setDiaSelecionado(iso)}
                className={`db-history-day ${preenchido ? "db-history-day-filled" : ""}`}
                aria-label={preenchido ? `${dia}: ${escalasNaData.length} escala(s)` : `Dia ${dia}, sem escalas`}
              >
                <span className="db-history-day-number">{dia}</span>
                {preenchido && (
                  <span className="db-history-day-content">
                    <span className="db-history-dot" />
                    <span>{escalasNaData.length === 1 ? escalasNaData[0].titulo : `${escalasNaData.length} escalas`}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {escalas.length === 0 && (
          <div className="db-empty mt-4">Nenhuma escala concluída no histórico.</div>
        )}
      </section>

      {diaSelecionado && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#020817]/70 p-3 backdrop-blur-sm sm:p-6" onMouseDown={() => setDiaSelecionado(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="historico-dia-titulo" className="db-member-modal db-history-day-dialog relative w-full max-w-lg p-5 sm:p-7" onMouseDown={(evento) => evento.stopPropagation()}>
            <button type="button" onClick={() => setDiaSelecionado(null)} className="db-icon-button absolute right-4 top-4 h-9 w-9" aria-label="Fechar">
              <X size={17} />
            </button>
            <p className="db-label">Escalas concluídas</p>
            <h2 id="historico-dia-titulo" className="db-title mt-2 pr-11 text-2xl text-paper">
              {dataCompleta(diaSelecionado)}
            </h2>
            <div className="mt-5 space-y-3">
              {escalasDoDia.map((escala) => (
                <button key={escala.id} type="button" onClick={() => { setDiaSelecionado(null); setEscalaSelecionada(escala); }} className="db-history-event-card w-full text-left">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <strong>{escala.titulo}</strong>
                    <StatusBadge status={escala.status} />
                  </span>
                  <span className="mt-2 flex items-center gap-2 text-xs"><Users size={14} /> {escala.usuarioIds.length} membro(s)</span>
                  {escala.observacoes && <span className="mt-2 block line-clamp-2 text-xs">{escala.observacoes}</span>}
                </button>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted"><CalendarDays size={14} /> Toque em uma escala para ver todos os detalhes.</p>
          </section>
        </div>
      )}

      {escalaSelecionada && (
        <EscalaDetailsDialog escala={escalaSelecionada} usuarios={usuarios} onClose={() => setEscalaSelecionada(null)} />
      )}
    </>
  );
}
