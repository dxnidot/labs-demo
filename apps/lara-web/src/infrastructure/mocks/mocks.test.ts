// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import type { ActualizacionStreaming } from "../../application/ports/AgentePort";
import { MockAgenteAdapter } from "./MockAgenteAdapter";
import { MockAuthAdapter } from "./MockAuthAdapter";
import { MockEstadoLabAdapter } from "./MockEstadoLabAdapter";
import { MockFinanzasAdapter } from "./MockFinanzasAdapter";
import { MockMenuAdapter } from "./MockMenuAdapter";
import { MockModeloAdapter } from "./MockModeloAdapter";

const hoy = new Date(2026, 9, 10);
const periodo = "2026-10";

describe("MockAuthAdapter", () => {
  it("entra siempre como un usuario ficticio con acceso a todas las secciones y sin token", async () => {
    const auth = new MockAuthAdapter();

    const usuario = await auth.init();
    expect(usuario?.username).toBe("demo");
    expect(usuario?.roles).toEqual(expect.arrayContaining(["ver_agentes", "ver_identidad", "ver-finanzas"]));
    expect(auth.usuarioActual()).toEqual(usuario);
    expect(auth.token()).toBeNull();
    expect(JSON.stringify(auth.claimsToken())).toContain("mock");
    await expect(auth.login()).resolves.toBeUndefined();
  });
});

describe("MockEstadoLabAdapter, MockModeloAdapter y MockMenuAdapter", () => {
  it("muestra los dos estados de salud", async () => {
    const lab = new MockEstadoLabAdapter();
    expect(await lab.comprobar("keycloak")).toBe("arriba");
    expect(await lab.comprobar("kc-demo")).toBe("sin-respuesta");
  });

  it("ofrece un modelo básico y uno avanzado", async () => {
    const modelos = await new MockModeloAdapter().listarDisponibles();
    expect(modelos.map((modelo) => modelo.tier)).toEqual(["basic", "advanced"]);
  });

  it("devuelve opciones de menú con ruta y acciones", async () => {
    const menu = await new MockMenuAdapter().obtenerMenu();
    expect(menu.length).toBeGreaterThan(0);
    expect(menu.every((opcion) => opcion.ruta.startsWith("/") && opcion.acciones.length > 0)).toBe(true);
  });
});

describe("MockAgenteAdapter", () => {
  it("lista sesiones sembradas, más recientes primero, solo del usuario ficticio", async () => {
    const agente = new MockAgenteAdapter(0);

    const propias = await agente.listarSesiones("usuario-mock");
    expect(propias).toHaveLength(3);
    expect(propias[0].actualizado.getTime()).toBeGreaterThan(propias[1].actualizado.getTime());
    expect(propias.map((sesion) => sesion.titulo)).toContain("Aclaración por cargo no reconocido");
    expect(await agente.listarSesiones("otra-persona")).toEqual([]);
  });

  it("la sesión sembrada de aclaración trae el evento A2A con sus pasos completados", async () => {
    const agente = new MockAgenteAdapter(0);
    const sesiones = await agente.listarSesiones("usuario-mock");
    const conAclaracion = sesiones.find(
      (candidata) => candidata.titulo === "Aclaración por cargo no reconocido",
    );
    expect(conAclaracion).toBeDefined();

    const mensajes = await agente.obtenerSesion("usuario-mock", conAclaracion!.id);
    const evento = mensajes.find((mensaje) => mensaje.rol === "evento");
    expect(evento?.texto).toBe("orquestador → aclaraciones · A2A · transfiere el control");
    expect(evento?.pasos).toHaveLength(3);
    expect(evento?.pasos?.every((paso) => paso.completado)).toBe(true);
    expect(mensajes.at(-1)?.texto).toContain("ACL-0001");
  });

  it("crea una sesión, transmite la respuesta por fragmentos y la guarda en memoria", async () => {
    const agente = new MockAgenteAdapter(0);
    const id = await agente.crearSesion("usuario-mock", "Sesión nueva", "finanzas");
    const updates: ActualizacionStreaming[] = [];

    await agente.enviarMensaje(
      { userId: "usuario-mock", sessionId: id, texto: "Hola", modeloId: "mock/modelo-basico" },
      (update) => updates.push(update),
    );

    expect(updates[0]).toEqual({ tipo: "herramienta", nombre: "consultar_resumen" });
    expect(updates.filter((u) => u.tipo === "texto").length).toBeGreaterThan(1);
    const mensajes = await agente.obtenerSesion("usuario-mock", id);
    expect(mensajes.map((m) => m.rol)).toEqual(["usuario", "agente"]);
    expect(mensajes[1].texto).toContain("modo mock");
    expect((await agente.listarSesiones("usuario-mock")).find((s) => s.id === id)?.origen).toBe("finanzas");
  });

  it("enviar un mensaje que menciona 'aclaración' transmite el evento a2a y los 3 pasos antes del texto", async () => {
    const agente = new MockAgenteAdapter(0);
    const id = await agente.crearSesion("usuario-mock", "Otra aclaración", "chat");
    const updates: ActualizacionStreaming[] = [];

    await agente.enviarMensaje(
      { userId: "usuario-mock", sessionId: id, texto: "Quiero una aclaración", modeloId: "m" },
      (update) => updates.push(update),
    );

    expect(updates[0]).toEqual({
      tipo: "a2a",
      origen: "orquestador",
      destino: "aclaraciones",
      modo: "transfiere el control",
    });
    const pasos = updates.filter((u) => u.tipo === "paso");
    expect(pasos.map((p) => (p as { clave: string }).clave)).toEqual([
      "validarTarjeta",
      "registrarAclaracion",
      "devolverFolio",
    ]);
    expect(pasos.every((p) => (p as { completado: boolean }).completado)).toBe(true);
    const ultimaActualizacion = updates.at(-1);
    expect(ultimaActualizacion?.tipo).toBe("texto");

    const mensajes = await agente.obtenerSesion("usuario-mock", id);
    expect(mensajes.map((m) => m.rol)).toEqual(["usuario", "evento", "agente"]);
  });

  it("rechaza sesiones inexistentes o de otro usuario", async () => {
    const agente = new MockAgenteAdapter(0);
    await expect(agente.obtenerSesion("usuario-mock", "no-existe")).rejects.toThrow();
    await expect(
      agente.enviarMensaje({ userId: "otra", sessionId: "sesion-mock-1", texto: "x", modeloId: "m" }, vi.fn()),
    ).rejects.toThrow();
  });
});

describe("MockFinanzasAdapter", () => {
  const nuevo = () => new MockFinanzasAdapter(() => hoy);

  it("trae tarjetas con una inactiva y movimientos de tres meses con las tres procedencias", async () => {
    const finanzas = nuevo();

    const tarjetas = await finanzas.listarTarjetas();
    expect(tarjetas).toHaveLength(5);
    expect(tarjetas.filter((t) => !t.activa)).toHaveLength(1);
    const movimientos = await finanzas.listarMovimientos();
    expect(new Set(movimientos.map((m) => m.fecha.slice(0, 7)))).toEqual(
      new Set(["2026-10", "2026-09", "2026-08"]),
    );
    expect(new Set(movimientos.map((m) => m.origen))).toEqual(new Set(["MANUAL", "IMPORT", "NOTIFICACION"]));
    expect(new Set(movimientos.map((m) => m.moneda))).toEqual(new Set(["MXN", "USD"]));
  });

  it("calcula el resumen mensual sumando por tipo, moneda y categoría", async () => {
    const resumen = await nuevo().consultarResumenMensual(periodo);

    expect(resumen.find((f) => f.categoria === "Vivienda" && f.tipo === "GASTO")?.total).toBe(7500);
    expect(resumen.find((f) => f.categoria === "Suscripciones" && f.moneda === "USD")?.total).toBe(12.99);
    expect(resumen.find((f) => f.tipo === "INGRESO")?.total).toBe(33500);
    expect(await nuevo().consultarResumenMensual("1999-01")).toEqual([]);
  });

  it("calcula el calendario de los próximos 30 días solo con tarjetas activas, ordenado por fecha", async () => {
    const eventos = await nuevo().consultarCalendario("2026-10-10", 30);

    expect(eventos.length).toBeGreaterThan(0);
    expect(eventos.map((e) => e.fecha)).toEqual([...eventos.map((e) => e.fecha)].sort());
    expect(eventos.every((e) => e.fecha >= "2026-10-10" && e.fecha <= "2026-11-09")).toBe(true);
    expect(eventos.some((e) => e.alias === "Tarjeta D")).toBe(false);
    expect(eventos).toContainEqual({ fecha: "2026-10-15", tipo: "PAGO", alias: "Tarjeta C" });
    expect(eventos).toContainEqual({ fecha: "2026-10-15", tipo: "CORTE", alias: "Tarjeta A" });
  });

  it("actualizar una tarjeta se queda en memoria y la saca del calendario si queda inactiva", async () => {
    const finanzas = nuevo();
    const [primera] = await finanzas.listarTarjetas();

    const actualizada = await finanzas.actualizarTarjeta({ ...primera, activa: false });

    expect(actualizada.activa).toBe(false);
    expect((await finanzas.listarTarjetas())[0].activa).toBe(false);
    expect((await finanzas.consultarCalendario("2026-10-10", 30)).some((e) => e.alias === primera.alias)).toBe(false);
    await expect(finanzas.actualizarTarjeta({ ...primera, id: "no-existe" })).rejects.toThrow();
  });

  it("importar: la vista previa no guarda nada y confirmar suma los movimientos una sola vez", async () => {
    const finanzas = nuevo();
    const antes = (await finanzas.listarMovimientos()).length;

    const preview = await finanzas.previsualizarImportacion(new File(["x"], "ejemplo.csv"));
    expect(preview.totalRegistros).toBe(3);
    expect((await finanzas.listarMovimientos()).length).toBe(antes);

    expect(await finanzas.confirmarImportacion(preview.importId)).toEqual({ totalRegistros: 3 });
    expect((await finanzas.listarMovimientos()).length).toBe(antes + 3);
    await expect(finanzas.confirmarImportacion(preview.importId)).rejects.toThrow();
  });
});
