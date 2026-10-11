// MOCK: agente de chat ficticio; las sesiones viven solo en memoria y se pierden al recargar.
import type { ActualizacionStreaming, AgentePort } from "../../application/ports/AgentePort";
import type { Mensaje, PasoFlujo } from "../../domain/Mensaje";
import type { OrigenSesion, SesionChat } from "../../domain/SesionChat";

interface SesionEnMemoria extends SesionChat {
  usuario: string;
  mensajes: Mensaje[];
}

const respuesta = [
  "Esta es una respuesta de ejemplo del **modo mock**: no sale de ningún modelo.",
  "\n\n- Los datos que ves son ficticios.\n- Nada se envía a ningún proveedor.",
];

/** Palabra disparadora de ejemplo para simular una delegación A2A con pasos (mockup 04). */
const disparadorA2a = "aclarac";
const pasosAclaraciones = [
  { clave: "validarTarjeta", nombre: "Validar tarjeta" },
  { clave: "registrarAclaracion", nombre: "Registrar aclaración" },
  { clave: "devolverFolio", nombre: "Generar folio" },
] as const;
const respuestaAclaraciones = "Tu folio es ACL-0001 (de ejemplo). Te aviso cuando cambie de estado.";
const separadorAclaraciones = "orquestador → aclaraciones · A2A · transfiere el control";

/**
 * Cumple AgentePort con sesiones y respuestas de ejemplo; simula el streaming por fragmentos.
 * @author Daniel Tovar
 * @since 2026-10-10
 * @modified Daniel Tovar 2026-10-10 Simula una delegación A2A con pasos cuando el mensaje menciona "aclarac...".
 */
export class MockAgenteAdapter implements AgentePort {
  private readonly sesiones = new Map<string, SesionEnMemoria>();
  private contador = 0;

  constructor(private readonly retardoMs = 20) {
    this.sembrar("Resumen de gastos de ejemplo", "chat", 2);
    this.sembrar("Pagos de tarjeta de ejemplo", "chat", 5);
    this.sembrarAclaracion();
  }

  crearSesion(userId: string, titulo: string, origen: OrigenSesion = "chat"): Promise<string> {
    return Promise.resolve(this.crear(userId, titulo, origen, new Date()));
  }

  listarSesiones(userId: string): Promise<SesionChat[]> {
    const propias = Array.from(this.sesiones.values()).filter((sesion) => sesion.usuario === userId);
    return Promise.resolve(
      propias
        .map(({ id, titulo, actualizado, origen }) => ({ id, titulo, actualizado, origen }))
        .sort((a, b) => b.actualizado.getTime() - a.actualizado.getTime()),
    );
  }

  obtenerSesion(userId: string, sessionId: string): Promise<Mensaje[]> {
    const sesion = this.sesiones.get(sessionId);
    if (!sesion || sesion.usuario !== userId) {
      return Promise.reject(new Error("La sesión de ejemplo no existe."));
    }
    return Promise.resolve([...sesion.mensajes]);
  }

  async enviarMensaje(
    input: { userId: string; sessionId: string; texto: string; modeloId: string },
    onUpdate: (update: ActualizacionStreaming) => void,
  ): Promise<void> {
    const sesion = this.sesiones.get(input.sessionId);
    if (!sesion || sesion.usuario !== input.userId) {
      throw new Error("La sesión de ejemplo no existe.");
    }

    sesion.mensajes.push({ rol: "usuario", texto: input.texto, fecha: new Date() });

    if (input.texto.toLowerCase().includes(disparadorA2a)) {
      await this.simularDelegacionAclaraciones(sesion, onUpdate);
      return;
    }

    onUpdate({ tipo: "herramienta", nombre: "consultar_resumen" });
    let acumulado = "";
    for (const fragmento of respuesta) {
      await this.esperar();
      acumulado += fragmento;
      onUpdate({ tipo: "texto", operacion: "agregar", texto: fragmento });
    }
    sesion.mensajes.push({ rol: "agente", texto: acumulado, fecha: new Date() });
    sesion.actualizado = new Date();
  }

  /** Ejemplo de ActualizacionStreaming "a2a" + "paso": el orquestador delega en "aclaraciones". */
  private async simularDelegacionAclaraciones(
    sesion: SesionEnMemoria,
    onUpdate: (update: ActualizacionStreaming) => void,
  ): Promise<void> {
    await this.esperar();
    onUpdate({ tipo: "a2a", origen: "orquestador", destino: "aclaraciones", modo: "transfiere el control" });
    const pasos: PasoFlujo[] = [];
    for (const paso of pasosAclaraciones) {
      await this.esperar();
      onUpdate({ ...paso, tipo: "paso", completado: true });
      pasos.push({ ...paso, completado: true });
    }
    await this.esperar();
    onUpdate({ tipo: "texto", operacion: "agregar", texto: respuestaAclaraciones });
    sesion.mensajes.push(
      { rol: "evento", texto: separadorAclaraciones, fecha: new Date(), pasos },
      { rol: "agente", texto: respuestaAclaraciones, fecha: new Date() },
    );
    sesion.actualizado = new Date();
  }

  private esperar(): Promise<void> {
    return new Promise((resolver) => setTimeout(resolver, this.retardoMs));
  }

  private crear(userId: string, titulo: string, origen: OrigenSesion, actualizado: Date): string {
    this.contador += 1;
    const id = `sesion-mock-${this.contador}`;
    this.sesiones.set(id, { id, titulo, origen, actualizado, usuario: userId, mensajes: [] });
    return id;
  }

  /** Sesión de ejemplo con un separador A2A y sus pasos ya resueltos, como en el mockup 04. */
  private sembrarAclaracion(): void {
    const fecha = new Date(Date.now() - 7 * 3_600_000);
    const id = this.crear("usuario-mock", "Aclaración por cargo no reconocido", "chat", fecha);
    this.sesiones.get(id)?.mensajes.push(
      { rol: "usuario", texto: "Quiero levantar una aclaración por un cargo que no reconozco.", fecha },
      {
        rol: "evento",
        texto: separadorAclaraciones,
        fecha,
        pasos: pasosAclaraciones.map((paso) => ({ ...paso, completado: true })),
      },
      { rol: "agente", texto: respuestaAclaraciones, fecha },
    );
  }

  private sembrar(titulo: string, origen: OrigenSesion, haceHoras: number): void {
    const fecha = new Date(Date.now() - haceHoras * 3_600_000);
    const id = this.crear("usuario-mock", titulo, origen, fecha);
    this.sesiones.get(id)?.mensajes.push(
      { rol: "usuario", texto: `Pregunta de ejemplo: ${titulo.toLowerCase()}.`, fecha },
      { rol: "agente", texto: "Respuesta de ejemplo del **modo mock**.", fecha },
    );
  }
}
