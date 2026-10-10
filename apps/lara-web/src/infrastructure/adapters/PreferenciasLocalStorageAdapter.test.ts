import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { PreferenciasLocalStorageAdapter, claveFuente, claveTema } from "./PreferenciasLocalStorageAdapter";

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
    expect(html).toContain(`localStorage.getItem("${claveTema}")`);
    expect(html).toContain("dataset.font");
    expect(html).toContain("dataset.theme");
  });
});

describe("PreferenciasLocalStorageAdapter (tema)", () => {
  it("el tema por defecto es sistema", () => {
    expect(new PreferenciasLocalStorageAdapter(() => almacenEnMemoria()).leerTema()).toBe("sistema");
  });

  it.each(["claro", "oscuro", "sistema"] as const)("guarda y lee %s con la clave lara.tema", (tema) => {
    const almacen = almacenEnMemoria();
    const adaptador = new PreferenciasLocalStorageAdapter(() => almacen);
    adaptador.guardarTema(tema);
    expect(almacen.getItem("lara.tema")).toBe(tema);
    expect(adaptador.leerTema()).toBe(tema);
  });

  it("ignora un valor desconocido y no lanza con el almacenamiento bloqueado", () => {
    expect(
      new PreferenciasLocalStorageAdapter(() => almacenEnMemoria({ "lara.tema": "sepia" })).leerTema(),
    ).toBe("sistema");
    const bloqueado = new PreferenciasLocalStorageAdapter(almacenQueLanza);
    expect(bloqueado.leerTema()).toBe("sistema");
    expect(() => bloqueado.guardarTema("claro")).not.toThrow();
  });

  it("solo usa las claves lara.fuente y lara.tema", () => {
    const almacen = almacenEnMemoria();
    const adaptador = new PreferenciasLocalStorageAdapter(() => almacen);
    adaptador.guardarFuente("ibm-plex-mono");
    adaptador.guardarTema("oscuro");
    expect(Array.from({ length: almacen.length }, (_, i) => almacen.key(i)).sort()).toEqual([
      "lara.fuente",
      "lara.tema",
    ]);
  });
});
