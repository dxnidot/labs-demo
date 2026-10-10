import type { AgentePort } from "../application/ports/AgentePort";
import type { AuthPort } from "../application/ports/AuthPort";
import type { EstadoLabPort } from "../application/ports/EstadoLabPort";
import type { FinanzasPort } from "../application/ports/FinanzasPort";
import type { MenuPort } from "../application/ports/MenuPort";
import type { ModeloPort } from "../application/ports/ModeloPort";
import { AdkAgenteAdapter } from "./adapters/AdkAgenteAdapter";
import { ApiHttpClient } from "./adapters/ApiHttpClient";
import { HttpEstadoLabAdapter } from "./adapters/HttpEstadoLabAdapter";
import { HttpFinanzasAdapter } from "./adapters/HttpFinanzasAdapter";
import { HttpMenuAdapter } from "./adapters/HttpMenuAdapter";
import { HttpModeloAdapter } from "./adapters/HttpModeloAdapter";
import { keycloakAuthAdapter } from "./adapters/KeycloakAuthAdapter";
import { MockAgenteAdapter } from "./mocks/MockAgenteAdapter";
import { MockAuthAdapter } from "./mocks/MockAuthAdapter";
import { MockEstadoLabAdapter } from "./mocks/MockEstadoLabAdapter";
import { MockFinanzasAdapter } from "./mocks/MockFinanzasAdapter";
import { MockMenuAdapter } from "./mocks/MockMenuAdapter";
import { MockModeloAdapter } from "./mocks/MockModeloAdapter";

/** Adaptadores que usa la UI, uno por puerto. */
export interface Adaptadores {
  auth: AuthPort;
  agente: AgentePort;
  modelo: ModeloPort;
  estadoLab: EstadoLabPort;
  menu: MenuPort;
  finanzas: FinanzasPort;
}

/** Con VITE_USE_MOCKS=true la UI usa datos ficticios sin Keycloak ni backend (ver .env.example). */
export const usarMocks = import.meta.env.VITE_USE_MOCKS === "true";

function crearReales(): Adaptadores {
  const http = new ApiHttpClient(keycloakAuthAdapter);
  return {
    auth: keycloakAuthAdapter,
    agente: new AdkAgenteAdapter(keycloakAuthAdapter),
    modelo: new HttpModeloAdapter(http),
    estadoLab: new HttpEstadoLabAdapter(),
    menu: new HttpMenuAdapter(http),
    finanzas: new HttpFinanzasAdapter(http),
  };
}

// MOCK: adaptadores ficticios que cumplen los mismos puertos que los reales.
function crearMocks(): Adaptadores {
  return {
    auth: new MockAuthAdapter(),
    agente: new MockAgenteAdapter(),
    modelo: new MockModeloAdapter(),
    estadoLab: new MockEstadoLabAdapter(),
    menu: new MockMenuAdapter(),
    finanzas: new MockFinanzasAdapter(),
  };
}

/**
 * Único lugar que decide qué adaptadores usa Lara: los reales o los mock, según VITE_USE_MOCKS.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export const adaptadores: Adaptadores = usarMocks ? crearMocks() : crearReales();
