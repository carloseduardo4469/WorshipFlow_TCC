"use client";

import { useEffect, useState } from "react";
import { Mail, Music4, Phone, X } from "lucide-react";
import { listarUsuariosComPresenca } from "@/lib/actions/usuarios";
import type { Usuario } from "@/types/domain";

const nomesHabilidades: Record<string, string> = {
  violao: "Violão",
  guitarra: "Guitarra",
  bateria: "Bateria",
  teclado: "Teclado",
  baixo: "Baixo",
  "voz-principal": "Voz principal",
  "voz-secundaria": "Voz secundária",
};

// Considera online quem teve atividade nos últimos 2 minutos.
const LIMITE_ONLINE_MS = 2 * 60 * 1000;

function habilidadesLista(usuario: Usuario): string[] {
  return (usuario.habilidades ?? "")
    .split(",")
    .map((habilidade) => habilidade.trim())
    .filter(Boolean)
    .map((habilidade) => nomesHabilidades[habilidade] ?? habilidade);
}

function estaOnline(usuario: Usuario, agora: number): boolean {
  if (!usuario.ultimaAtividade) return false;
  const ultima = new Date(usuario.ultimaAtividade).getTime();
  if (Number.isNaN(ultima)) return false;
  return agora - ultima < LIMITE_ONLINE_MS;
}

function Avatar({ usuario, className = "" }: { usuario: Usuario; className?: string }) {
  const iniciais = usuario.nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]!.toUpperCase())
    .join("");

  if (usuario.fotoPerfilUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={usuario.fotoPerfilUrl} alt={`Foto de ${usuario.nome}`} loading="lazy" className={`shrink-0 rounded-full object-cover ${className}`} />;
  }

  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e9d375] to-[#5ccee0] font-bold text-[#07101e] ${className}`}>
      {iniciais}
    </span>
  );
}

function BadgeOnline({ online }: { online: boolean }) {
  return (
    <span className={online ? "db-badge db-badge-green" : "db-badge db-badge-muted"}>
      {online ? "Online" : "Offline"}
    </span>
  );
}

export function EquipeTable({ usuarios: usuariosIniciais }: { usuarios: Usuario[] }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciais);
  const [selecionado, setSelecionado] = useState<Usuario | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelecionado(null);
    }
    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, []);

  // Atualiza a presença (quem está online/offline) e reavalia o relógio.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setAgora(Date.now());
      listarUsuariosComPresenca()
        .then((lista) => setUsuarios(lista))
        .catch(() => {});
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <div className="db-card db-data-table db-responsive-table p-2 sm:p-3">
        <table className="db-table w-full text-left text-sm">
          <thead className="bg-white/[0.035] text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Instrumentos</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:rgba(148,163,184,0.1)]">
            {usuarios.map((usuario) => {
              const online = estaOnline(usuario, agora);
              return (
                <tr
                  key={usuario.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelecionado(usuario)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelecionado(usuario);
                    }
                  }}
                  className="db-responsive-row cursor-pointer transition hover:bg-cyan-300/[.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
                >
                  <td data-label="Nome" className="px-4 py-3.5">
                    <span className="flex items-center gap-3 text-paper font-medium">
                      <Avatar usuario={usuario} className="h-10 w-10 text-sm" />
                      <span className="min-w-0">
                        <span className="block truncate">{usuario.nome}</span>
                        <span className="block truncate text-xs font-normal text-muted">{usuario.email}</span>
                      </span>
                    </span>
                  </td>
                  <td data-label="Instrumentos" className="px-4 py-3.5 align-top">
                    {habilidadesLista(usuario).length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {habilidadesLista(usuario).map((habilidade) => (
                          <span key={habilidade} className="db-badge db-badge-muted text-[11px]">
                            {habilidade}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted">Não informado</span>
                    )}
                  </td>
                  <td data-label="Status" className="px-4 py-3.5">
                    <BadgeOnline online={online} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selecionado && (
        <div
          role="presentation"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#020817]/70 p-4 backdrop-blur-sm"
          onMouseDown={() => setSelecionado(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="perfil-equipe-titulo"
            className="db-member-modal relative w-full max-w-md overflow-y-auto overscroll-contain p-6 sm:p-7"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelecionado(null)}
              aria-label="Fechar detalhes"
              className="db-icon-button absolute right-4 top-4 z-10 h-9 w-9"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center">
              <Avatar usuario={selecionado} className="h-24 w-24 text-2xl ring-2 ring-cyan-300/45" />
              <p className="db-label mt-4 text-cyan-300">Perfil da equipe</p>
              <h2 id="perfil-equipe-titulo" className="db-title mt-1 pr-0 text-3xl text-paper">
                {selecionado.nome}
              </h2>
              <div className="mt-3">
                <BadgeOnline online={estaOnline(selecionado, agora)} />
              </div>
            </div>

            <dl className="mt-6 grid gap-4">
              <div>
                <dt className="db-label flex items-center gap-1.5">
                  <Music4 size={14} className="text-cyan-300" />
                  Instrumentos
                </dt>
                <dd className="mt-2">
                  {habilidadesLista(selecionado).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {habilidadesLista(selecionado).map((habilidade) => (
                        <span key={habilidade} className="db-badge db-badge-muted text-[11px]">
                          {habilidade}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-paper">Não informado</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="db-label flex items-center gap-1.5">
                  <Mail size={14} className="text-cyan-300" />
                  E-mail
                </dt>
                <dd className="mt-1 break-all text-sm font-semibold text-paper">{selecionado.email}</dd>
              </div>
              {selecionado.telefone && (
                <div>
                  <dt className="db-label flex items-center gap-1.5">
                    <Phone size={14} className="text-cyan-300" />
                    Telefone
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-paper">{selecionado.telefone}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      )}
    </>
  );
}
