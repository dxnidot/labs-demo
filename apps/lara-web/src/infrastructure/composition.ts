import type { AgentePort } from "../application/ports/AgentePort";
import type { AuthPort } from "../application/ports/AuthPort";
import type { BaseDatosPort } from "../application/ports/BaseDatosPort";
import type { BpmSyncPort } from "../application/ports/BpmSyncPort";
import type { EstadoLabPort } from "../application/ports/EstadoLabPort";
import type { FinanzasPort } from "../application/ports/FinanzasPort";
import type { GastosFijosPort } from "../application/ports/GastosFijosPort";
import type { MemoriaPort } from "../application/ports/MemoriaPort";
import type { MenuPort } from "../application/ports/MenuPort";
import type { MenuPorRolPort } from "../application/ports/MenuPorRolPort";
import type { ModeloPort } from "../application/ports/ModeloPort";
import type { UsuariosRealmPort } from "../application/ports/UsuariosRealmPort";
import { AdkAgenteAdapter } from "./adapters/AdkAgenteAdapter";
import { ApiHttpClient } from "./adapters/ApiHttpClient";
import { HttpEstadoLabAdapter } from "./adapters/HttpEstadoLabAdapter";
import { HttpFinanzasAdapter } from "./adapters/HttpFinanzasAdapter";
import { HttpMenuAdapter } from "./adapters/HttpMenuAdapter";
import { HttpModeloAdapter } from "./adapters/HttpModeloAdapter";
import { keycloakAuthAdapter } from "./adapters/KeycloakAuthAdapter";
import { MockAgenteAdapter } from "./mocks/MockAgenteAdapter";
import { MockAuthAdapter } from "./mocks/MockAuthAdapter";
import { MockBaseDatosAdapter } from "./mocks/MockBaseDatosAdapter";
import { MockBpmSyncAdapter } from "./mocks/MockBpmSyncAdapter";
import { MockEstadoLabAdapter } from "./mocks/MockEstadoLabAdapter";
import { MockFinanzasAdapter } from "./mocks/MockFinanzasAdapter";
import { MockGastosFijosAdapter } from "./mocks/MockGastosFijosAdapter";
import { MockMemoriaAdapter } from "./mocks/MockMemoriaAdapter";
import { MockMenuAdapter } from "./mocks/MockMenuAdapter";
import { MockMenuPorRolAdapter } from "./mocks/MockMenuPorRolAdapter";
import { MockModeloAdapter } from "./mocks/MockModeloAdapter";
import { MockUsuariosRealmAdapter } from "./mocks/MockUsuariosRealmAdapter";

/**
 * Adaptadores que usa la UI, uno por puerto.
 * Los seis puertos de la fase C restante (06,07,09,10,11,13) todavía no tienen
 * backend real, así que `baseDatos`, `memoria`, `menuPorRol`, `usuariosRealm`,
 * `bpm` y `gastosFijos` son siempre el adaptador mock, tanto en `crearReales()`
 * como en `crearMocks()`, hasta que exista el adaptador HTTP correspondiente.
 */
export interface Adaptadores {
  auth: AuthPort;
  agente: AgentePort;
  modelo: ModeloPort;
  estadoLab: EstadoLabPort;
  menu: MenuPort;
  finanzas: FinanzasPort;
  baseDatos: BaseDatosPort;
  memoria: MemoriaPort;
  menuPorRol: MenuPorRolPort;
  usuariosRealm: UsuariosRealmPort;
  bpm: BpmSyncPort;
  gastosFijos: GastosFijosPort;
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
    // MOCK: sin backend real todavía para estos seis puertos (fase C restante).
    baseDatos: new MockBaseDatosAdapter(),
    memoria: new MockMemoriaAdapter(),
    menuPorRol: new MockMenuPorRolAdapter(),
    usuariosRealm: new MockUsuariosRealmAdapter(),
    bpm: new MockBpmSyncAdapter(),
    gastosFijos: new MockGastosFijosAdapter(),
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
    baseDatos: new MockBaseDatosAdapter(),
    memoria: new MockMemoriaAdapter(),
    menuPorRol: new MockMenuPorRolAdapter(),
    usuariosRealm: new MockUsuariosRealmAdapter(),
    bpm: new MockBpmSyncAdapter(),
    gastosFijos: new MockGastosFijosAdapter(),
  };
}

/**
 * Único lugar que decide qué adaptadores usa Lara: los reales o los mock, según VITE_USE_MOCKS.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export const adaptadores: Adaptadores = usarMocks ? crearMocks() : crearReales();
