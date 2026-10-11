import { describe, expect, it } from "vitest";
import type { ActualizacionStreaming } from "../application/ports/AgentePort";
import type { Mensaje } from "../domain/Mensaje";
import { agregarOActualizarPaso, agregarOActualizarTexto } from "./chatEventos";

const fecha = new Date("2026-10-10T00:00:00.000Z");
const evento = (pasos: Mensaje["pasos"] = []): Mensaje => ({ rol: "evento", texto: "a → b", fecha, pasos });
const agente = (texto: string): Mensaje => ({ rol: "agente", texto, fecha });
const usuario = (texto: string): Mensaje => ({ rol: "usuario", texto, fecha });

describe("agregarOActualizarPaso", () => {
  const paso = (clave: string, completado = true): Extract<ActualizacionStreaming, { tipo: "paso" }> => ({
    tipo: "paso",
    clave,
    nombre: `Nombre ${clave}`,
    completado,
  });

  it("sin ningún evento previo, devuelve los mensajes sin cambios", () => {
    const mensajes = [usuario("hola")];
    expect(agregarOActualizarPaso(mensajes, paso("x"))).toBe(mensajes);
  });

  it("agrega el paso al último evento", () => {
    const mensajes = [usuario("hola"), evento()];
    const resultado = agregarOActualizarPaso(mensajes, paso("validarTarjeta"));
    expect(resultado[1].pasos).toEqual([
      { clave: "validarTarjeta", nombre: "Nombre validarTarjeta", completado: true },
    ]);
  });

  it("actualiza un paso existente en vez de duplicarlo", () => {
    const mensajes = [evento([{ clave: "x", nombre: "X", completado: false }])];
    const resultado = agregarOActualizarPaso(mensajes, paso("x", true));
    expect(resultado[0].pasos).toHaveLength(1);
    expect(resultado[0].pasos?.[0]).toEqual({ clave: "x", nombre: "X", completado: true });
  });

  it("usa el evento más reciente cuando hay varios", () => {
    const mensajes = [evento([{ clave: "viejo", nombre: "Viejo", completado: true }]), agente("ok"), evento()];
    const resultado = agregarOActualizarPaso(mensajes, paso("nuevo"));
    expect(resultado[0].pasos).toHaveLength(1);
    expect(resultado[2].pasos).toHaveLength(1);
  });

  it("no muta el arreglo ni el mensaje original", () => {
    const mensajes = [evento()];
    agregarOActualizarPaso(mensajes, paso("x"));
    expect(mensajes[0].pasos).toEqual([]);
  });
});

describe("agregarOActualizarTexto", () => {
  const texto = (contenido: string, operacion: "agregar" | "reemplazar" = "agregar") =>
    ({ tipo: "texto", operacion, texto: contenido }) as const;

  it("acumula sobre el último mensaje si ya es del agente", () => {
    const mensajes = [usuario("hola"), agente("Hola")];
    const resultado = agregarOActualizarTexto(mensajes, texto(", mundo"));
    expect(resultado[1].texto).toBe("Hola, mundo");
  });

  it("reemplaza en vez de acumular cuando la operación es reemplazar", () => {
    const mensajes = [agente("borrador")];
    const resultado = agregarOActualizarTexto(mensajes, texto("final", "reemplazar"));
    expect(resultado[0].texto).toBe("final");
  });

  it("crea un mensaje de agente nuevo si el último es un evento (respuesta tras A2A)", () => {
    const mensajes = [usuario("hola"), evento()];
    const resultado = agregarOActualizarTexto(mensajes, texto("Listo"));
    expect(resultado).toHaveLength(3);
    expect(resultado[2]).toMatchObject({ rol: "agente", texto: "Listo" });
  });

  it("crea un mensaje de agente nuevo si el último es del usuario (primer fragmento)", () => {
    const mensajes = [usuario("hola")];
    const resultado = agregarOActualizarTexto(mensajes, texto("Hola"));
    expect(resultado).toHaveLength(2);
    expect(resultado[1]).toMatchObject({ rol: "agente", texto: "Hola" });
  });
});
