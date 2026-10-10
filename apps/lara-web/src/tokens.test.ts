import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const raizUi = new URL("./ui/", import.meta.url);

function archivosTsx(directorio: URL): string[] {
  return readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = new URL(entrada.name + (entrada.isDirectory() ? "/" : ""), directorio);
    if (entrada.isDirectory()) {
      return archivosTsx(ruta);
    }
    return entrada.name.endsWith(".tsx") && !entrada.name.endsWith(".test.tsx")
      ? [fileURLToPath(ruta)]
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

  it("define --font-sans (IBM Plex Sans por defecto) y --font-mono (IBM Plex Mono)", () => {
    const css = readFileSync(new URL("./index.css", import.meta.url), "utf8");
    expect(css).toMatch(/--font-sans:\s*"IBM Plex Sans"/);
    expect(css).toMatch(/--font-mono:\s*"IBM Plex Mono"/);
    expect(css).toMatch(/:root\[data-font="ibm-plex-mono"\]\s*\{\s*--font-sans:\s*var\(--font-mono\)/);
  });

  it("hay una regla global de foco visible con el token accent y una de movimiento reducido", () => {
    const css = readFileSync(new URL("./index.css", import.meta.url), "utf8");
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--color-accent\)/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(css).toMatch(/animation:\s*none !important/);
  });

  it("index.html enlaza el favicon y parte de un título genérico", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    expect(html).toContain('rel="icon" href="/favicon.svg"');
    expect(html).toContain("<title>Lara</title>");
  });
});
