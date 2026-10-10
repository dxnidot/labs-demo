import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const raizUi = new URL("./ui/", import.meta.url);

function archivosTsx(directorio: URL): string[] {
  return readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = new URL(entrada.name + (entrada.isDirectory() ? "/" : ""), directorio);
    if (entrada.isDirectory()) {
      return archivosTsx(ruta);
    }
    return entrada.name.endsWith(".tsx") && !entrada.name.endsWith(".test.tsx")
      ? [join(ruta.pathname)]
      : [];
  });
}

const componentes = archivosTsx(raizUi).map((ruta) => ({
  ruta,
  texto: readFileSync(ruta, "utf8"),
}));

function infracciones(patron: RegExp): string[] {
  return componentes.flatMap(({ ruta, texto }) =>
    (texto.match(patron) ?? []).map((hallazgo) => `${ruta.split("/src/")[1]}: ${hallazgo}`),
  );
}

describe("tokens de index.css en los componentes", () => {
  it("no hay colores hexadecimales sueltos", () => {
    expect(infracciones(/#[0-9a-fA-F]{3,8}\b/g)).toEqual([]);
  });

  it("no se usan las escalas crudas neutral-* ni hoki-*: solo tokens semánticos", () => {
    expect(
      infracciones(/\b[a-z:-]*(?:bg|text|border|ring|outline|fill|stroke|divide|accent)-(?:neutral|hoki)-\d+/g),
    ).toEqual([]);
  });

  it("no quedan los alias muertos mint, butter, pink, lavender ni peach", () => {
    expect(infracciones(/\b(?:bg|text|border)-(?:pill-)?(?:mint|butter|pink|lavender|peach)\b/g)).toEqual([]);
  });

  it("no hay tamaños de texto, radios ni cortes arbitrarios: van a la escala o a un token", () => {
    expect(
      infracciones(/\b(?:text|rounded|leading|tracking|size|min-w|max-w)-\[[^\]]+\]|min-\[[^\]]+\]:/g),
    ).toEqual([]);
  });

  it("los cortes personalizados van en rem, como los de Tailwind, para que las variantes se ordenen bien", () => {
    const css = readFileSync(new URL("./index.css", import.meta.url), "utf8");
    const cortes = css.match(/--breakpoint-[a-z]+:\s*[^;]+;/g) ?? [];
    expect(cortes.length).toBeGreaterThan(0);
    for (const corte of cortes) {
      expect(corte).toMatch(/rem;$/);
    }
  });
});
