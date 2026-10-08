import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizarTom, keyShapeDaTonalidade, tomParaSelecao, TONALIDADES_SELECIONAVEIS, isTonalidadeValida } from "./tonalidades";
import { aplicarTonalidadeAoLinkCifra, gerarLinkCifraClub, resolverCifraOriginalSemCapotraste } from "./cifraclub";

afterEach(() => vi.unstubAllGlobals());

const casos: [number, string, string[]][] = [
  [0, "A", ["A"]], [1, "A#", ["A#", "Bb"]], [2, "B", ["B", "Cb"]],
  [3, "C", ["C", "B#"]], [4, "C#", ["C#", "Db"]], [5, "D", ["D"]],
  [6, "D#", ["D#", "Eb"]], [7, "E", ["E", "Fb"]], [8, "F", ["F", "E#"]],
  [9, "F#", ["F#", "Gb"]], [10, "G", ["G"]], [11, "G#", ["G#", "Ab"]],
];

describe("enarmônicos e keyShape", () => {
  it("detecta um tom original menor com bemol Unicode sem mudar seu modo", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response('Tom: </span><button>B♭m</button>')));
    const result = await resolverCifraOriginalSemCapotraste({ titulo: "Fé", artista: "FHOP" });
    expect(result?.tonalidade).toBe("A#m");
    expect(new URL(result!.linkCifra).searchParams.get("keyShape")).toBe("1");
  });
  it.each(casos)("shape %i: exibe %s e preserva o modo", (shape, exibir, nomes) => {
    for (const nome of nomes) {
      for (const modo of ["", "m"]) {
        for (const entrada of [nome + modo, nome.replace("#", "♯").replace("b", "♭") + modo]) {
          expect(normalizarTom(entrada)).toBe(exibir + modo);
          expect(keyShapeDaTonalidade(entrada)).toBe(shape);
          const link = gerarLinkCifraClub({ titulo: "Teste", artista: "FHOP", tonalidade: entrada });
          expect(new URL(link!).searchParams.get("keyShape")).toBe(String(shape));
        }
      }
      expect(isTonalidadeValida(nome)).toBe(true);
      expect(isTonalidadeValida(nome + "m")).toBe(false);
    }
  });

  it("mantém apenas maiores no seletor e converte a referência menor pela relativa", () => {
    expect(TONALIDADES_SELECIONAVEIS).toHaveLength(13);
    expect(TONALIDADES_SELECIONAVEIS.some((tom) => tom.endsWith("m"))).toBe(false);
    expect(tomParaSelecao("Bbm")).toBe("C#");
    expect(normalizarTom("Bbm")).toBe("A#m");
    const result = aplicarTonalidadeAoLinkCifra({
      linkCifra: "https://www.cifraclub.com.br/artista/musica/?capo=2&foo=bar&keyShape=8#trecho",
      tonalidadeOriginal: "Fm", tonalidadeSelecionada: "Db",
    });
    expect(result?.tonalidade).toBe("A#m");
    const url = new URL(result!.linkCifra);
    expect(url.searchParams.get("keyShape")).toBe("1");
    expect(url.searchParams.get("capo")).toBe("2");
    expect(url.searchParams.get("foo")).toBe("bar");
    expect(url.hash).toBe("#trecho");
  });

  it.each(["", "H", "C##", "Gbb", "Am7", "Ab/G#"])("rejeita entrada inválida %s", (entrada) => {
    expect(normalizarTom(entrada)).toBeNull();
    expect(keyShapeDaTonalidade(entrada)).toBeNull();
  });
});
