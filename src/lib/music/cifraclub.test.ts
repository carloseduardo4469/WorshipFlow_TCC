import { describe, expect, it } from "vitest";
import { gerarLinkCifraClub, toCifraClubSlug } from "./cifraclub";

describe("links de cifra", () => {
  it("normaliza título e artista com acentos", () => {
    expect(toCifraClubSlug("Águas Purificadoras")).toBe("aguas-purificadoras");
  });

  it("resolve o alias FHOP e sempre remove o capotraste", () => {
    const link = gerarLinkCifraClub({ titulo: "Fé", artista: "FHOP", tonalidade: "E" });
    expect(link).toContain("florianopolis-house-of-prayer/fe");
    expect(new URL(link!).searchParams.get("capo")).toBe("0");
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
});
