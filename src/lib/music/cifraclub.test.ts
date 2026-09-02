import { describe, expect, it } from "vitest";
import {
  aplicarTonalidadeAoLinkCifra,
  extrairUrlCifraClub,
  gerarLinkCifraClub,
  toCifraClubSlug,
} from "./cifraclub";

describe("links de cifra", () => {
  it("normaliza título e artista com acentos", () => {
    expect(toCifraClubSlug("Águas Purificadoras")).toBe("aguas-purificadoras");
  });

  it("extrai a URL pura quando um link Markdown foi salvo no banco", () => {
    expect(
      extrairUrlCifraClub(
        "[https://www.cifraclub.com.br/nengo-vieira/a-vida/](https://www.cifraclub.com.br/nengo-vieira/a-vida/)"
      )
    ).toBe("https://www.cifraclub.com.br/nengo-vieira/a-vida/");
  });

  it("resolve o alias FHOP e sempre remove o capotraste", () => {
    const link = gerarLinkCifraClub({ titulo: "Fé", artista: "FHOP", tonalidade: "E" });
    expect(link).toContain("florianopolis-house-of-prayer/fe");
    expect(new URL(link!).searchParams.get("capo")).toBe("0");
  });

  it.each([
    ["MORADA", "ministerio-morada"],
    ["FHOP Music", "florianopolis-house-of-prayer"],
    ["Dunamis Music", "dunamis-movement"],
    ["Kemuel", "coral-kemuel"],
    ["Pedras Vivas", "ministerio-pedras-vivas"],
  ])("resolve o nome de artista %s para o caminho oficial", (artista, caminho) => {
    const link = gerarLinkCifraClub({ titulo: "Música teste", artista, tonalidade: "C" });
    expect(new URL(link!).pathname).toContain(`/${caminho}/`);
  });

  it.each([
    ["Só Tu És Santo", "MORADA", "/ministerio-morada/so-tu-s-santo/"],
    ["Toda Terra", "Gabriela Rocha", "/gabriela-rocha/toda-terra-ao-vivo/"],
    ["Lindo És / Só Quero Ver Você", "Juliano Son", "/juliano-son/lindo-s/"],
    ["Hô Pai", "Nengo Vieira", "/nengo-vieira/hi-pai/"],
    ["Tempo de Adorar", "Nengo Vieira", "/nengo-vieira/tempo-de-perdoar/"],
  ])("resolve a rota especial de %s", (titulo, artista, caminho) => {
    const link = gerarLinkCifraClub({ titulo, artista, tonalidade: "C" });
    expect(new URL(link!).pathname).toBe(caminho);
  });

  it("abre música menor na relativa menor do tom escolhido", () => {
    const link = gerarLinkCifraClub({
      titulo: "Fé",
      artista: "FHOP music",
      tonalidade: "G",
      tomOriginal: "C#m",
    });
    expect(new URL(link!).searchParams.get("keyShape")).toBe("7");
  });

  it("preserva a versão exata da cifra ao trocar o tom", () => {
    const resultado = aplicarTonalidadeAoLinkCifra({
      linkCifra:
        "https://www.cifraclub.com.br/ministerio-morada/so-tu-es-santo-uma-coisa-deixa-queimar-quando-ele-vem-ao-vivo/simplificada.html?capo=0&keyShape=0",
      tonalidadeOriginal: "A",
      tonalidadeSelecionada: "C",
    });

    expect(resultado?.linkCifra).toContain(
      "/so-tu-es-santo-uma-coisa-deixa-queimar-quando-ele-vem-ao-vivo/simplificada.html"
    );
    expect(new URL(resultado!.linkCifra).searchParams.get("capo")).toBe("0");
    expect(new URL(resultado!.linkCifra).searchParams.get("keyShape")).toBe("3");
    expect(resultado?.tonalidade).toBe("C");
  });

  it("usa o deslocamento próprio da página e a relativa menor", () => {
    const resultado = aplicarTonalidadeAoLinkCifra({
      linkCifra: "https://www.cifraclub.com.br/gabriela-rocha/a-ele-a-gloria/?capo=0&keyShape=7",
      tonalidadeOriginal: "Ebm",
      tonalidadeSelecionada: "G",
    });

    expect(new URL(resultado!.linkCifra).searchParams.get("keyShape")).toBe("8");
    expect(resultado?.tonalidade).toBe("Em");
  });

  it("não altera links externos ou sem keyShape validado", () => {
    expect(
      aplicarTonalidadeAoLinkCifra({
        linkCifra: "https://example.com/cifra",
        tonalidadeOriginal: "A",
        tonalidadeSelecionada: "C",
      })
    ).toBeNull();
  });
});
