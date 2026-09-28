import { describe, expect, it } from "vitest";
import { criarAvisosEscala } from "./events";
import { endpointPermitido, subscriptionSchema } from "./subscription";
import type { Escala } from "@/types/domain";
const escala: Escala = { id: 12, titulo: "Culto de domingo", dataEscala: "2026-10-04", status: "PUBLICADA", observacoes: null,
  usuarioIds: ["ana", "lucas"], funcoesUsuarios: [{ usuarioId: "ana", funcao: "voz-principal" }, { usuarioId: "lucas", funcao: "guitarra" }],
  musicaIds: [], tonalidadesMusicas: [], createdAt: "" };
describe("avisos individuais de escalas", () => {
  it("avisa apenas os integrantes, com data e função individual", () => {
    const notices = criarAvisosEscala(null, escala);
    expect(notices).toHaveLength(2);
    expect(notices[1]).toMatchObject({ usuario_id: "lucas", tipo: "nova" });
    expect(notices[1].mensagem).toContain("domingo, 04/10/2026");
    expect(notices[1].mensagem).toContain("Guitarra");
    expect(notices[1].mensagem).not.toContain("Voz principal");
  });
  it("distingue quem entrou, saiu e permaneceu", () => {
    const notices = criarAvisosEscala(escala, { ...escala, usuarioIds: ["ana", "bia"], funcoesUsuarios: [{ usuarioId: "ana", funcao: "voz-principal" }, { usuarioId: "bia", funcao: "baixo" }] });
    expect(notices.find((n) => n.usuario_id === "lucas")).toMatchObject({ tipo: "saida" });
    expect(notices.find((n) => n.usuario_id === "bia")).toMatchObject({ tipo: "entrada" });
    expect(notices.find((n) => n.usuario_id === "ana")).toMatchObject({ tipo: "alteracao" });
  });
  it("não avisa ao salvar sem mudanças ou reordenar os membros", () => {
    expect(criarAvisosEscala(escala, { ...escala, usuarioIds: [...escala.usuarioIds].reverse(), funcoesUsuarios: [...escala.funcoesUsuarios].reverse() })).toEqual([]);
    expect(criarAvisosEscala(null, { ...escala, status: "RASCUNHO" })).toEqual([]);
  });
  it("informa mudança de instrumento e data", () => {
    const notices = criarAvisosEscala(escala, { ...escala, dataEscala: "2026-10-05", funcoesUsuarios: [{ usuarioId: "lucas", funcao: "baixo,violao" }] });
    expect(notices.find((n) => n.usuario_id === "lucas")?.mensagem).toContain("05/10/2026 · Baixo e Violão");
  });
  it("avisa sobre exclusão sem manter o integrante escalado", () => {
    expect(criarAvisosEscala(escala, null).every((notice) => notice.tipo === "cancelamento" && notice.mensagem.includes("não está mais"))).toBe(true);
  });
});
describe("endereços de push", () => {
  it.each(["https://fcm.googleapis.com/fcm/send/test", "https://web.push.apple.com/test", "https://updates.push.services.mozilla.com/wpush/v2/test"])("aceita provedor %s", (endpoint) => expect(endpointPermitido(endpoint)).toBe(true));
  it.each(["http://fcm.googleapis.com/test", "https://localhost/test", "https://127.0.0.1", "https://fcm.googleapis.com.evil.com", "https://evil.com/?fcm.googleapis.com", "https://user:pass@fcm.googleapis.com/test", "https://fcm.googleapis.com:8443/test"])("rejeita endpoint %s", (endpoint) => expect(endpointPermitido(endpoint)).toBe(false));
  it("valida as chaves de criptografia", () => expect(subscriptionSchema.safeParse({ endpoint: "https://fcm.googleapis.com/test", keys: { auth: "invalid", p256dh: "invalid" } }).success).toBe(false));
});
