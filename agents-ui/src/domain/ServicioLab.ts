/** Resultado de una comprobación de salud: contestó o no contestó a tiempo. */
export type Disponibilidad = "arriba" | "sin-respuesta";

export type ClaveServicio = "keycloak" | "adk" | "kc-demo" | "finanzas";

export interface ServicioLab {
  clave: ClaveServicio;
  nombre: string;
  detalle: string;
}

export interface EstadoServicio {
  servicio: ServicioLab;
  disponibilidad: Disponibilidad;
}

/** Servicios del lab que Lara puede comprobar hoy. */
export const serviciosLab: readonly ServicioLab[] = [
  { clave: "keycloak", nombre: "Keycloak", detalle: ":8080 · realm lab" },
  { clave: "adk", nombre: "ADK API", detalle: ":8010 · orquestador" },
  { clave: "kc-demo", nombre: "kc-demo", detalle: ":8081 · Spring Boot" },
  { clave: "finanzas", nombre: "finanzas", detalle: ":8083 · servicio finanzas" },
];
