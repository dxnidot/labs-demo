import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./index.css", import.meta.url), "utf8");

function paleta(): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const [, nombre, hex] of css.matchAll(/--color-((?:neutral|hoki|sage)-\d+):\s*(#[0-9a-fA-F]{6});/g)) {
    mapa.set(nombre, hex.toLowerCase());
  }
  return mapa;
}

type Tema = "claro" | "oscuro";

/** Resuelve un token semántico (light-dark o referencia simple) a hexadecimal en el tema dado. */
export function resolverToken(token: string, tema: Tema, colores = paleta()): string {
  const definicion = css.match(new RegExp(`--color-${token}:\\s*([^;]+);`))?.[1];
  if (!definicion) {
    throw new Error(`Token --color-${token} no definido`);
  }
  const ld = definicion.match(/light-dark\(\s*var\(--color-([\w-]+)\)\s*,\s*var\(--color-([\w-]+)\)\s*\)/);
  const nombre = ld ? ld[tema === "claro" ? 1 : 2] : definicion.match(/var\(--color-([\w-]+)\)/)?.[1];
  if (!nombre) {
    throw new Error(`No se pudo resolver --color-${token}: ${definicion}`);
  }
  return colores.get(nombre) ?? resolverToken(nombre, tema, colores);
}

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const canal = parseInt(hex.slice(i, i + 2), 16) / 255;
    return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

const fondos = ["bg", "surface", "surface-active"];
/** Texto (WCAG 1.4.3): >= 4.5:1. */
const paresTexto: Array<[string, string]> = [
  ...["text", "text-2", "muted", "faint", "accent", "highlight", "ok", "warn", "danger"].flatMap(
    (texto) => fondos.map((fondo): [string, string] => [texto, fondo]),
  ),
  ["accent-ink", "accent"],
  ["accent-ink", "accent-hover"],
  ["highlight-ink", "highlight"],
  ["highlight-muted", "highlight"],
];
/** Controles y estados (WCAG 1.4.11): >= 3:1. chart-5 queda fuera: va con etiqueta y valor en texto. */
const paresControl: Array<[string, string]> = [
  ["border-control", "surface"],
  ["border-control", "bg"],
  ["border-control", "surface-active"],
  ["control-off", "surface"],
  ["control-off", "surface-active"],
  ["accent", "surface"],
  ["accent", "bg"],
  ["ok", "surface"],
  ["warn", "surface"],
  ["danger", "surface"],
  ...["chart-1", "chart-2", "chart-3", "chart-4"].flatMap((serie) =>
    ["surface", "surface-active"].map((fondo): [string, string] => [serie, fondo]),
  ),
];
const temas: Tema[] = ["claro", "oscuro"];

describe("contraste de los tokens en ambos temas", () => {
  it.each(temas.flatMap((tema) => paresTexto.map(([texto, fondo]) => ({ tema, texto, fondo }))))(
    "texto $texto sobre $fondo en tema $tema >= 4.5:1",
    ({ tema, texto, fondo }) => {
      expect(contraste(resolverToken(texto, tema), resolverToken(fondo, tema))).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(temas.flatMap((tema) => paresControl.map(([primero, fondo]) => ({ tema, primero, fondo }))))(
    "control/estado $primero sobre $fondo en tema $tema >= 3:1",
    ({ tema, primero, fondo }) => {
      expect(contraste(resolverToken(primero, tema), resolverToken(fondo, tema))).toBeGreaterThanOrEqual(3);
    },
  );

  it("el tema oscuro conserva los valores de la guía (README > Tokens)", () => {
    const guia: Record<string, string> = {
      bg: "#0a0c0e",
      surface: "#131416",
      "surface-active": "#292929",
      border: "#292929",
      text: "#fafafa",
      "text-2": "#e6e6e6",
      muted: "#a8c29c",
      faint: "#85a378",
      accent: "#a8c29c",
      "accent-hover": "#cddbc6",
      "accent-ink": "#1b2318",
      highlight: "#cddbc6",
      "highlight-ink": "#1b2318",
      ok: "#85a378",
      warn: "#a5a5a5",
      danger: "#d6d6d6",
    };
    for (const [token, hex] of Object.entries(guia)) {
      expect(resolverToken(token, "oscuro"), token).toBe(hex);
    }
  });

  it("ok y danger se distinguen también por forma (no solo por color)", () => {
    const componente = readFileSync(new URL("./ui/components/PuntoEstado.tsx", import.meta.url), "utf8");
    expect(componente).toMatch(/ok: "rounded-full bg-ok"/);
    expect(componente).toMatch(/danger: "rounded-full border-2 border-danger"/);
  });
});

describe("theme-color de index.html", () => {
  it("cada tema usa el --color-bg de ese tema", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    for (const tema of temas) {
      const meta = html.match(new RegExp(`<meta name="theme-color" content="(#[0-9a-f]{6})"[^>]*data-tema="${tema}"`));
      expect(meta?.[1], `meta theme-color ${tema}`).toBe(resolverToken("bg", tema));
    }
  });

  it("el favicon usa el accent de cada tema (no puede leer variables CSS)", () => {
    const svg = readFileSync(new URL("../public/favicon.svg", import.meta.url), "utf8").toLowerCase();
    expect(svg).toContain(`:root { color: ${resolverToken("accent", "claro")}; }`);
    expect(svg).toContain(`:root { color: ${resolverToken("accent", "oscuro")}; }`);
  });
});
