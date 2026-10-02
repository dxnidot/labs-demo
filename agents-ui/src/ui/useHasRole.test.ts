import { describe, expect, it } from "vitest";
import type { Usuario } from "../domain/Usuario";
import { useHasRole } from "./useHasRole";

function usuarioConRoles(roles: string[]): Usuario {
  return { id: "u1", username: "ana", roles, chatApiRoles: [] };
}

describe("useHasRole", () => {
  it("devuelve true cuando el usuario tiene alguno de los roles pedidos", () => {
    expect(useHasRole(usuarioConRoles(["ver_agentes"]), ["ver_agentes", "admin"])).toBe(true);
  });

  it("devuelve true con semántica OR aunque solo coincida un rol", () => {
    expect(useHasRole(usuarioConRoles(["admin"]), ["ver_agentes", "admin"])).toBe(true);
  });

  it("devuelve false cuando ningún rol coincide", () => {
    expect(useHasRole(usuarioConRoles(["otro-rol"]), ["ver_agentes", "admin"])).toBe(false);
  });

  it("no normaliza: la coincidencia es exacta", () => {
    expect(useHasRole(usuarioConRoles(["Ver_Agentes"]), ["ver_agentes"])).toBe(false);
  });

  it("devuelve false cuando el usuario no tiene roles", () => {
    expect(useHasRole(usuarioConRoles([]), ["ver_agentes", "admin"])).toBe(false);
  });
});
