import type { FinanzasPort } from "../../application/ports/FinanzasPort";
import type { EventoCalendario } from "../../domain/EventoCalendario";
import type { Tarjeta } from "../../domain/Tarjeta";
import { ApiHttpClient } from "./ApiHttpClient";

/**
 * Adapta la API autenticada de finanzas a su puerto de aplicación.
 * @author Daniel
 * @since 2026-09-30
 */
export class HttpFinanzasAdapter implements FinanzasPort {
  constructor(private readonly http: ApiHttpClient) {}

  async listarTarjetas(): Promise<Tarjeta[]> {
    const response = await this.http.solicitar("/api/finanzas/tarjetas");
    if (!Array.isArray(response) || !response.every(esTarjeta)) {
      throw new Error("La API de finanzas devolvió una lista de tarjetas inválida.");
    }
    return response;
  }

  async consultarCalendario(
    desde: string,
    dias: number,
  ): Promise<EventoCalendario[]> {
    const query = new URLSearchParams({ desde, dias: String(dias) });
    const response = await this.http.solicitar(
      `/api/finanzas/calendario?${query.toString()}`,
    );
    if (!Array.isArray(response) || !response.every(esEventoCalendario)) {
      throw new Error("La API de finanzas devolvió un calendario inválido.");
    }
    return response;
  }

  async actualizarTarjeta(tarjeta: Tarjeta): Promise<Tarjeta> {
    const response = await this.http.solicitar(
      `/api/finanzas/tarjetas/${encodeURIComponent(tarjeta.id)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          alias: tarjeta.alias,
          ultimos4: tarjeta.ultimos4,
          diaCorte: tarjeta.diaCorte,
          diaPago: tarjeta.diaPago,
          permiteLiquidarMsiAnticipado: tarjeta.permiteLiquidarMsiAnticipado,
          activa: tarjeta.activa,
        }),
      },
    );
    if (!esTarjeta(response)) {
      throw new Error("La API de finanzas devolvió una tarjeta inválida.");
    }
    return response;
  }
}

function esTarjeta(value: unknown): value is Tarjeta {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "alias" in value &&
    typeof value.alias === "string" &&
    "ultimos4" in value &&
    typeof value.ultimos4 === "string" &&
    /^[0-9]{4}$/.test(value.ultimos4) &&
    "diaCorte" in value &&
    typeof value.diaCorte === "number" &&
    "diaPago" in value &&
    typeof value.diaPago === "number" &&
    "permiteLiquidarMsiAnticipado" in value &&
    typeof value.permiteLiquidarMsiAnticipado === "boolean" &&
    "activa" in value &&
    typeof value.activa === "boolean"
  );
}

function esEventoCalendario(value: unknown): value is EventoCalendario {
  return (
    typeof value === "object" &&
    value !== null &&
    "fecha" in value &&
    typeof value.fecha === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.fecha) &&
    "tipo" in value &&
    (value.tipo === "CORTE" || value.tipo === "PAGO") &&
    "alias" in value &&
    typeof value.alias === "string"
  );
}
