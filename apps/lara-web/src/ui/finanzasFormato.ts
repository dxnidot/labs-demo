import type { Moneda, OrigenMovimiento } from "../domain/MovimientoFinanciero";

export const formatoMoneda: Record<Moneda, Intl.NumberFormat> = {
  MXN: new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }),
  USD: new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD" }),
};

const formatoDiaMes = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const formatoDiaSemana = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  timeZone: "UTC",
});

const etiquetasOrigen: Record<OrigenMovimiento, string> = {
  MANUAL: "manual",
  IMPORT: "archivo",
  NOTIFICACION: "notificación",
};

/** Etiqueta de origen tal como la muestra la interfaz. */
export function etiquetaOrigen(origen: OrigenMovimiento): string {
  return etiquetasOrigen[origen];
}

function aFechaUtc(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

/** Fecha corta como "5 oct". */
export function fechaCorta(fecha: string): string {
  return formatoDiaMes.format(aFechaUtc(fecha)).replace(/\.$/, "");
}

/** Fecha con día de la semana como "domingo 5 oct". */
export function fechaConDiaSemana(fecha: string): string {
  const instante = aFechaUtc(fecha);
  return `${formatoDiaSemana.format(instante)} ${fechaCorta(fecha)}`;
}

/** Muestra únicamente los últimos cuatro dígitos enmascarados. */
export function enmascarar(ultimos4: string): string {
  return `••••${ultimos4}`;
}

/** Fecha local de hoy como AAAA-MM-DD. */
export function fechaLocalActual(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

/** Periodo local actual como AAAA-MM. */
export function periodoActual(): string {
  return fechaLocalActual().slice(0, 7);
}
