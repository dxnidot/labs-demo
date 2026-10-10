import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { PreferenciasLocalStorageAdapter, claveFuente } from "./PreferenciasLocalStorageAdapter";

function almacenEnMemoria(inicial: Record<string, string> = {}): Storage {
  const datos = new Map(Object.entries(inicial));
  return {
    get length() {
      return datos.size;
    },
    clear: () => datos.clear(),
    getItem: (clave) => datos.get(clave) ?? null,
    key: (indice) => Array.from(datos.keys())[indice] ?? null,
    removeItem: (clave) => void datos.delete(clave),
    setItem: (clave, valor) => void datos.set(clave, valor),
  };
}

function almacenQueLanza(): Storage {
  const error = new DOMException("bloqueado", "SecurityError");
  return {
    get length(): number {
      throw error;
    },
    clear: () => {
      throw error;
    },
    getItem: () => {
      throw error;
    },
    key: () => {
      throw error;
    },
    removeItem: () => {
      throw error;
    },
    setItem: () => {
      throw error;
    },
  };
}

describe("PreferenciasLocalStorageAdapter (fuente)", () => {
  it("devuelve IBM Plex Sans cuando no hay nada guardado", () => {
    const adaptador = new PreferenciasLocalStorageAdapter(() => almacenEnMemoria());
    expect(adaptador.leerFuente()).toBe("ibm-plex-sans");
  });

  it("guarda y lee la fuente con la clave lara.fuente", () => {
    const almacen = almacenEnMemoria();
    const adaptador = new PreferenciasLocalStorageAdapter(() => almacen);
    adaptador.guardarFuente("ibm-plex-mono");
    expect(almacen.getItem("lara.fuente")).toBe("ibm-plex-mono");
    expect(adaptador.leerFuente()).toBe("ibm-plex-mono");
  });

  it("ignora un valor guardado que no es una fuente conocida", () => {
    const adaptador = new PreferenciasLocalStorageAdapter(() =>
      almacenEnMemoria({ [claveFuente]: "Comic Sans" }),
    );
    expect(adaptador.leerFuente()).toBe("ibm-plex-sans");
  });

  it("no lanza si localStorage está bloqueado: lee el valor por defecto y no guarda", () => {
    const adaptador = new PreferenciasLocalStorageAdapter(almacenQueLanza);
    expect(adaptador.leerFuente()).toBe("ibm-plex-sans");
    expect(() => adaptador.guardarFuente("ibm-plex-mono")).not.toThrow();
  });

  it("no lanza si ni siquiera se puede acceder a localStorage", () => {
    const adaptador = new PreferenciasLocalStorageAdapter(
      vi.fn(() => {
        throw new DOMException("sin acceso", "SecurityError");
      }),
    );
    expect(adaptador.leerFuente()).toBe("ibm-plex-sans");
  });
});

describe("index.html", () => {
  it("aplica antes del primer render la misma clave que usa el adaptador", () => {
    const html = readFileSync(new URL("../../../index.html", import.meta.url), "utf8");
    expect(html).toContain(`localStorage.getItem("${claveFuente}")`);
    expect(html).toContain("dataset.font");
  });
});
