// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mensaje } from "../domain/Mensaje";
import type { Usuario } from "../domain/Usuario";
import { ChatPage } from "./ChatPage";

const usuario: Usuario = { id: "u1", username: "ana", roles: [], kcMenuRoles: [] };

const chatFake = vi.hoisted(() => ({
  activeSessionId: null as string | null,
  refreshSessions: vi.fn(async () => {}),
  sessions: [] as Array<{ id: string; titulo: string }>,
  setActiveSessionId: vi.fn(),
  obtenerSesion: vi.fn(async (): Promise<Mensaje[]> => []),
  enviarMensaje: vi.fn(
    async (
      _texto: string,
      _sesion: string | null,
      _onUpdate: (update: unknown) => void,
      _modeloId: string,
      ..._resto: unknown[]
    ): Promise<string> => "sesion-1",
  ),
}));

vi.mock("../infrastructure/adapters/KeycloakAuthAdapter", () => ({
  keycloakAuthAdapter: { updateToken: vi.fn(async () => "sin-token"), init: vi.fn(), logout: vi.fn() },
}));

vi.mock("./useChatSessions", () => ({
  useChatSessions: () => chatFake,
}));

beforeEach(() => {
  chatFake.activeSessionId = null;
  chatFake.obtenerSesion.mockReset();
  chatFake.obtenerSesion.mockResolvedValue([]);
  chatFake.enviarMensaje.mockReset();
  vi.stubGlobal("fetch", vi.fn(async () => new Response("[]", { status: 200 })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function montar() {
  return render(
    <MemoryRouter>
      <ChatPage usuario={usuario} />
    </MemoryRouter>,
  );
}

describe("ChatPage · abrir una conversación", () => {
  it("mientras carga muestra un esqueleto con aviso accesible", async () => {
    chatFake.activeSessionId = "s1";
    let resolver: (mensajes: Mensaje[]) => void = () => {};
    chatFake.obtenerSesion.mockReturnValue(new Promise((resuelto) => (resolver = resuelto)));

    const { container } = montar();

    expect((await screen.findByRole("status")).textContent).toBe("Cargando conversación…");
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    resolver([{ rol: "usuario", texto: "Hola", fecha: new Date() }]);
    expect(await screen.findByText("Hola")).toBeTruthy();
    expect(screen.queryByText("Cargando conversación…")).toBeNull();
  });

  it("si falla muestra el error y Reintentar vuelve a pedir la conversación", async () => {
    chatFake.activeSessionId = "s1";
    chatFake.obtenerSesion
      .mockRejectedValueOnce(new Error("No se pudo abrir la conversación."))
      .mockResolvedValueOnce([{ rol: "usuario", texto: "Mensaje recuperado", fecha: new Date() }]);

    montar();

    expect((await screen.findByRole("alert")).textContent).toBe("No se pudo abrir la conversación.");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Mensaje recuperado")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(chatFake.obtenerSesion).toHaveBeenCalledTimes(2);
  });
});

describe("ChatPage · enviar un mensaje", () => {
  async function escribirYEnviar(texto: string) {
    fireEvent.change(await screen.findByRole("textbox", { name: "Mensaje para Lara" }), {
      target: { value: texto },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
  }

  it("si el envío falla ofrece Reintentar, que reenvía el mismo texto sin duplicar el mensaje", async () => {
    chatFake.enviarMensaje
      .mockRejectedValueOnce(new Error("El agente no respondió."))
      .mockImplementationOnce(async (_texto, _sesion, onUpdate) => {
        onUpdate({ tipo: "texto", operacion: "agregar", texto: "Respuesta lista" });
        return "sesion-1";
      });

    montar();
    await escribirYEnviar("¿Cuánto gasté?");

    expect((await screen.findByRole("alert")).textContent).toBe("El agente no respondió.");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Respuesta lista")).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(chatFake.enviarMensaje).toHaveBeenCalledTimes(2);
    expect(chatFake.enviarMensaje.mock.calls[1][0]).toBe("¿Cuánto gasté?");
    expect(screen.getAllByText("¿Cuánto gasté?")).toHaveLength(1);
  });

  it("si la respuesta quedó a medias no ofrece reenviar (evita duplicar)", async () => {
    chatFake.enviarMensaje.mockImplementationOnce(async (_t, _s, onUpdate) => {
      onUpdate({ tipo: "texto", operacion: "agregar", texto: "Respuesta parcial" });
      throw new Error("Se cortó la conexión.");
    });

    montar();
    await escribirYEnviar("Hola");

    expect((await screen.findByRole("alert")).textContent).toBe("Se cortó la conexión.");
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
  });
});

describe("ChatPage · posición del scroll", () => {
  function simularAltura(alto: number) {
    return vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(alto);
  }

  it("el estado inicial arranca arriba y no baja al final del contenido (saludo visible a 320px)", async () => {
    const altura = simularAltura(900);

    montar();

    expect(((await screen.findByRole("log")) as HTMLElement).scrollTop).toBe(0);
    altura.mockRestore();
  });

  it("con una conversación abierta sí baja al último mensaje", async () => {
    const altura = simularAltura(900);
    chatFake.activeSessionId = "s1";
    chatFake.obtenerSesion.mockResolvedValue([
      { rol: "usuario", texto: "Hola", fecha: new Date() },
      { rol: "agente", texto: "Respuesta", fecha: new Date() },
    ]);

    montar();

    await screen.findByText("Respuesta");
    await waitFor(() => expect((screen.getByRole("log") as HTMLElement).scrollTop).toBe(900));
    altura.mockRestore();
  });
});

describe("ChatPage · eventos A2A y pasos", () => {
  it("muestra el separador A2A y los pasos con check cuando el agente delega", async () => {
    chatFake.enviarMensaje.mockImplementationOnce(async (_texto, _sesion, onUpdate) => {
      onUpdate({ tipo: "a2a", origen: "orquestador", destino: "aclaraciones", modo: "transfiere el control" });
      onUpdate({ tipo: "paso", clave: "validarTarjeta", nombre: "Validar tarjeta", completado: true });
      onUpdate({ tipo: "paso", clave: "registrarAclaracion", nombre: "Registrar aclaración", completado: true });
      onUpdate({ tipo: "texto", operacion: "agregar", texto: "Tu folio es ACL-0001." });
      return "sesion-1";
    });

    montar();
    fireEvent.change(await screen.findByRole("textbox", { name: "Mensaje para Lara" }), {
      target: { value: "¿Puedo levantar una aclaración?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByText("orquestador → aclaraciones · A2A · transfiere el control")).toBeTruthy();
    expect(screen.getByText("Validar tarjeta")).toBeTruthy();
    expect(screen.getByText("Registrar aclaración")).toBeTruthy();
    expect(await screen.findByText(/ACL-0001/)).toBeTruthy();
  });

  it("un paso sin evento A2A previo no rompe la conversación (se ignora)", async () => {
    chatFake.enviarMensaje.mockImplementationOnce(async (_texto, _sesion, onUpdate) => {
      onUpdate({ tipo: "paso", clave: "x", nombre: "Paso suelto", completado: true });
      onUpdate({ tipo: "texto", operacion: "agregar", texto: "Respuesta normal." });
      return "sesion-1";
    });

    montar();
    fireEvent.change(await screen.findByRole("textbox", { name: "Mensaje para Lara" }), {
      target: { value: "Hola" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByText("Respuesta normal.")).toBeTruthy();
    expect(screen.queryByText("Paso suelto")).toBeNull();
  });
});

describe("ChatPage · composer: adjuntar y memoria activa", () => {
  it("muestra el chip de memoria activa y el botón adjuntar deshabilitado", async () => {
    montar();

    expect(await screen.findByText("Memoria: activa")).toBeTruthy();
    const adjuntar = screen.getByRole("button", { name: "Adjuntar archivo (aún no disponible)" });
    expect((adjuntar as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByLabelText("Elegir archivo para adjuntar")).toBeNull();
  });
});

describe("ChatPage · accesibilidad y cancelación del envío", () => {
  it("al terminar la respuesta avisa en una región aria-live sin anunciar cada fragmento", async () => {
    chatFake.enviarMensaje.mockImplementationOnce(async (_t, _s, onUpdate) => {
      onUpdate({ tipo: "texto", operacion: "agregar", texto: "Listo" });
      return "sesion-1";
    });
    montar();
    fireEvent.change(await screen.findByRole("textbox", { name: "Mensaje para Lara" }), {
      target: { value: "Hola" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    const aviso = await screen.findByText("Lara respondió.");
    expect(aviso.getAttribute("aria-live")).toBe("polite");
  });

  it("pasa un AbortSignal al envío y lo aborta al salir del chat", async () => {
    let senal: AbortSignal | undefined;
    chatFake.enviarMensaje.mockImplementationOnce(async (...args: unknown[]) => {
      senal = args[5] as AbortSignal;
      return new Promise<string>(() => {});
    });
    const { unmount } = montar();
    fireEvent.change(await screen.findByRole("textbox", { name: "Mensaje para Lara" }), {
      target: { value: "Hola" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(senal).toBeDefined());
    expect(senal?.aborted).toBe(false);

    unmount();

    expect(senal?.aborted).toBe(true);
  });
});
