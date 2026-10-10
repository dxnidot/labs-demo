// Actualizar a mano si cambian agents/orquestador/agent.py o finanzas.py

export interface AgenteConfig {
  nombre: string;
  descripcion: string;
  detalle: string;
  colaboracion: "raíz" | "transfiere el control";
}

export type PermisoHerramienta = "permitida" | "solo lectura" | "escritura con confirmación";

export interface HerramientaConfig {
  nombre: string;
  origen: string;
  permiso: PermisoHerramienta;
}

// @modified Daniel Tovar 2026-10-01 Id real de DeepSeek (V4.1 Flash); se usa como respaldo si falla /api/llm/available-models.
export const modeloOrquestador = "deepseek/deepseek-flash";

export const agentesConfig: readonly AgenteConfig[] = [
  {
    nombre: "orquestador",
    descripcion:
      "Asistente de finanzas personales del lab: gastos, gastos fijos, sueldo, tarjetas de crédito, movimientos, resumen y calendario. También traduce y ayuda con programación.",
    detalle: `Python · ${modeloOrquestador} · agents/orquestador/agent.py`,
    colaboracion: "raíz",
  },
  {
    nombre: "finanzas",
    descripcion:
      "Agente educativo de finanzas personales para registrar tarjetas y movimientos, consultar resumen mensual y calendario.",
    detalle: `Python · ${modeloOrquestador} · agents/orquestador/finanzas.py`,
    colaboracion: "transfiere el control",
  },
];

export const herramientasConfig: readonly HerramientaConfig[] = [
  { nombre: "obtener_hora", origen: "function tool · orquestador", permiso: "permitida" },
  { nombre: "registrar_tarjetas", origen: "function tool · finanzas", permiso: "escritura con confirmación" },
  { nombre: "registrar_movimientos", origen: "function tool · finanzas", permiso: "escritura con confirmación" },
  { nombre: "consultar_resumen", origen: "function tool · finanzas", permiso: "solo lectura" },
  { nombre: "consultar_calendario", origen: "function tool · finanzas", permiso: "solo lectura" },
];
