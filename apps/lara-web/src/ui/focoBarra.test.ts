import { describe, expect, it } from "vitest";
import { focoAplicable } from "./focoBarra";

describe("focoAplicable", () => {
  it("'mostrar' solo se aplica con la barra ya contraída", () => {
    expect(focoAplicable("mostrar", false)).toBe("mostrar");
  });

  it("'contraer' solo se aplica con la barra ya visible", () => {
    expect(focoAplicable("contraer", true)).toBe("contraer");
  });

  it("un efecto con el estado anterior (p. ej. el del montaje) no consume el destino", () => {
    expect(focoAplicable("mostrar", true)).toBeNull();
    expect(focoAplicable("contraer", false)).toBeNull();
  });

  it("sin destino pendiente no hay nada que enfocar", () => {
    expect(focoAplicable(null, true)).toBeNull();
    expect(focoAplicable(null, false)).toBeNull();
  });
});
