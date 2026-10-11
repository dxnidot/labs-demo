// MOCK: finanzas ficticias; todo vive solo en memoria y se pierde al recargar. Nada es real.
import type { FinanzasPort } from "../../application/ports/FinanzasPort";
import type { EventoCalendario } from "../../domain/EventoCalendario";
import type { PreviewImportacion, ResultadoImportacion, MovimientoImportacion } from "../../domain/ImportacionFinanciera";
import type {
  Moneda,
  MovimientoFinanciero,
  OrigenMovimiento,
  ResumenCategoriaFinanciera,
  TipoMovimiento,
} from "../../domain/MovimientoFinanciero";
import type { Tarjeta } from "../../domain/Tarjeta";

const tarjetasIniciales: readonly Tarjeta[] = [
  { id: "tarjeta-mock-a", alias: "Tarjeta A", ultimos4: "1234", diaCorte: 15, diaPago: 5, permiteLiquidarMsiAnticipado: false, activa: true },
  { id: "tarjeta-mock-b", alias: "Tarjeta B", ultimos4: "5678", diaCorte: 25, diaPago: 6, permiteLiquidarMsiAnticipado: true, activa: true },
  { id: "tarjeta-mock-c", alias: "Tarjeta C", ultimos4: "9012", diaCorte: 25, diaPago: 15, permiteLiquidarMsiAnticipado: false, activa: true },
  { id: "tarjeta-mock-d", alias: "Tarjeta D", ultimos4: "3456", diaCorte: 16, diaPago: 6, permiteLiquidarMsiAnticipado: false, activa: false },
  { id: "tarjeta-mock-e", alias: "Tarjeta E", ultimos4: "7890", diaCorte: 1, diaPago: 21, permiteLiquidarMsiAnticipado: true, activa: true },
];

interface PlantillaMovimiento {
  dia: number;
  monto: number;
  moneda: Moneda;
  comercio: string;
  categoria: string;
  tarjeta: string | null;
  origen: OrigenMovimiento;
  tipo: TipoMovimiento;
}

const plantillas: readonly PlantillaMovimiento[] = [
  { dia: 1, monto: 7500, moneda: "MXN", comercio: "Renta de ejemplo", categoria: "Vivienda", tarjeta: null, origen: "MANUAL", tipo: "GASTO" },
  { dia: 3, monto: 420.5, moneda: "MXN", comercio: "Supermercado", categoria: "Comida", tarjeta: "tarjeta-mock-a", origen: "MANUAL", tipo: "GASTO" },
  { dia: 8, monto: 2100, moneda: "MXN", comercio: "Transporte de ejemplo", categoria: "Transporte", tarjeta: "tarjeta-mock-b", origen: "IMPORT", tipo: "GASTO" },
  { dia: 10, monto: 12.99, moneda: "USD", comercio: "Servicio en línea de ejemplo", categoria: "Suscripciones", tarjeta: "tarjeta-mock-b", origen: "NOTIFICACION", tipo: "GASTO" },
  { dia: 12, monto: 890, moneda: "MXN", comercio: "Suscripción de ejemplo", categoria: "Suscripciones", tarjeta: "tarjeta-mock-b", origen: "NOTIFICACION", tipo: "GASTO" },
  { dia: 14, monto: 780, moneda: "MXN", comercio: "Cena de ejemplo", categoria: "Comida", tarjeta: "tarjeta-mock-a", origen: "MANUAL", tipo: "GASTO" },
  { dia: 20, monto: 1630, moneda: "MXN", comercio: "Compras varias de ejemplo", categoria: "Otros", tarjeta: "tarjeta-mock-c", origen: "IMPORT", tipo: "GASTO" },
  { dia: 22, monto: 345.9, moneda: "MXN", comercio: "Farmacia de ejemplo", categoria: "Salud", tarjeta: "tarjeta-mock-e", origen: "MANUAL", tipo: "GASTO" },
  { dia: 1, monto: 32000, moneda: "MXN", comercio: "Sueldo de ejemplo", categoria: "Ingreso", tarjeta: null, origen: "MANUAL", tipo: "INGRESO" },
  { dia: 15, monto: 1500, moneda: "MXN", comercio: "Ingreso extra de ejemplo", categoria: "Ingreso", tarjeta: null, origen: "IMPORT", tipo: "INGRESO" },
];

/** Variación por mes (0 = el actual, -1 = el anterior…) para que el historial no sea idéntico cada mes. */
const factorPorMes = [1, 0.93, 1.07];

const importacionDeEjemplo: readonly MovimientoImportacion[] = [
  { fecha: "", monto: 215, moneda: "MXN", comercio: "Café de ejemplo", categoria: "Comida", tarjetaId: "tarjeta-mock-a", tipo: "GASTO" },
  { fecha: "", monto: 560.4, moneda: "MXN", comercio: "Gasolina de ejemplo", categoria: "Transporte", tarjetaId: "tarjeta-mock-b", tipo: "GASTO" },
  { fecha: "", monto: 900, moneda: "MXN", comercio: "Reembolso de ejemplo", categoria: "Ingreso", tarjetaId: null, tipo: "INGRESO" },
];

function dos(valor: number): string {
  return String(valor).padStart(2, "0");
}

function iso(fecha: Date): string {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function diasDelMes(anio: number, mes: number): number {
  return new Date(anio, mes + 1, 0).getDate();
}

/**
 * Cumple FinanzasPort con tarjetas, movimientos, resumen y calendario de ejemplo calculados al vuelo.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export class MockFinanzasAdapter implements FinanzasPort {
  private tarjetas: Tarjeta[] = tarjetasIniciales.map((tarjeta) => ({ ...tarjeta }));
  private movimientos: MovimientoFinanciero[];
  private readonly pendientes = new Map<string, MovimientoImportacion[]>();
  private contador = 0;

  constructor(private readonly hoy: () => Date = () => new Date()) {
    this.movimientos = this.sembrar();
  }

  listarTarjetas(): Promise<Tarjeta[]> {
    return Promise.resolve(this.tarjetas.map((tarjeta) => ({ ...tarjeta })));
  }

  listarMovimientos(): Promise<MovimientoFinanciero[]> {
    return Promise.resolve(this.movimientos.map((movimiento) => ({ ...movimiento })));
  }

  consultarResumenMensual(periodo: string): Promise<ResumenCategoriaFinanciera[]> {
    const totales = new Map<string, ResumenCategoriaFinanciera>();
    for (const movimiento of this.movimientos.filter((m) => m.fecha.startsWith(periodo))) {
      const clave = `${movimiento.tipo}|${movimiento.moneda}|${movimiento.categoria}`;
      const actual = totales.get(clave);
      totales.set(clave, {
        categoria: movimiento.categoria,
        tipo: movimiento.tipo,
        moneda: movimiento.moneda,
        total: redondear((actual?.total ?? 0) + movimiento.monto),
      });
    }
    return Promise.resolve(Array.from(totales.values()));
  }

  consultarCalendario(desde: string, dias: number): Promise<EventoCalendario[]> {
    const [anio, mes, dia] = desde.split("-").map(Number);
    const inicio = new Date(anio, mes - 1, dia);
    const fin = new Date(anio, mes - 1, dia + dias);
    const eventos: EventoCalendario[] = [];
    for (let desplazamiento = 0; desplazamiento <= Math.ceil(dias / 28) + 1; desplazamiento += 1) {
      const base = new Date(inicio.getFullYear(), inicio.getMonth() + desplazamiento, 1);
      for (const tarjeta of this.tarjetas.filter((candidata) => candidata.activa)) {
        for (const [tipo, diaDelMes] of [["PAGO", tarjeta.diaPago], ["CORTE", tarjeta.diaCorte]] as const) {
          const fecha = new Date(base.getFullYear(), base.getMonth(), Math.min(diaDelMes, diasDelMes(base.getFullYear(), base.getMonth())));
          if (fecha >= inicio && fecha <= fin) {
            eventos.push({ fecha: iso(fecha), tipo, alias: tarjeta.alias });
          }
        }
      }
    }
    return Promise.resolve(
      eventos.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.alias.localeCompare(b.alias)),
    );
  }

  actualizarTarjeta(tarjeta: Tarjeta): Promise<Tarjeta> {
    if (!this.tarjetas.some((existente) => existente.id === tarjeta.id)) {
      return Promise.reject(new Error("La tarjeta de ejemplo no existe."));
    }
    this.tarjetas = this.tarjetas.map((existente) => (existente.id === tarjeta.id ? { ...tarjeta } : existente));
    return Promise.resolve({ ...tarjeta });
  }

  /** No lee el archivo: devuelve una vista previa de ejemplo con fechas del día de hoy. */
  previsualizarImportacion(_archivo: File): Promise<PreviewImportacion> {
    this.contador += 1;
    const importId = `importacion-mock-${this.contador}`;
    const movimientos = importacionDeEjemplo.map((fila) => ({ ...fila, fecha: iso(this.hoy()) }));
    this.pendientes.set(importId, movimientos);
    return Promise.resolve({ importId, totalRegistros: movimientos.length, movimientos });
  }

  confirmarImportacion(importId: string): Promise<ResultadoImportacion> {
    const filas = this.pendientes.get(importId);
    if (!filas) {
      return Promise.reject(new Error("La importación de ejemplo no existe o ya se confirmó."));
    }
    this.pendientes.delete(importId);
    for (const fila of filas) {
      this.contador += 1;
      this.movimientos.push({
        id: `movimiento-mock-${this.contador}`,
        fecha: fila.fecha,
        monto: fila.monto,
        moneda: fila.moneda,
        comercio: fila.comercio,
        categoria: fila.categoria,
        tarjetaId: fila.tarjetaId,
        origen: "IMPORT",
        tipo: fila.tipo,
      });
    }
    return Promise.resolve({ totalRegistros: filas.length });
  }

  private sembrar(): MovimientoFinanciero[] {
    const hoy = this.hoy();
    return factorPorMes.flatMap((factor, indice) => {
      const mes = new Date(hoy.getFullYear(), hoy.getMonth() - indice, 1);
      return plantillas.map((plantilla, posicion) => ({
        id: `movimiento-mock-${indice}-${posicion}`,
        fecha: iso(new Date(mes.getFullYear(), mes.getMonth(), plantilla.dia)),
        monto: plantilla.tipo === "INGRESO" ? plantilla.monto : redondear(plantilla.monto * factor),
        moneda: plantilla.moneda,
        comercio: plantilla.comercio,
        categoria: plantilla.categoria,
        tarjetaId: plantilla.tarjeta,
        origen: plantilla.origen,
        tipo: plantilla.tipo,
      }));
    });
  }
}
