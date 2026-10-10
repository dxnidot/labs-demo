# ADR-0006: Convención de nombres

- Contexto: Tras reordenar el monorepo en `infra/`, `services/` y `apps/`, los nombres de servicios, bases de datos y objetos de Keycloak siguen varios estilos (`kc-demo`, `agents-ui`, `chat-api`, `usar-finanzas` frente a `usar_finanzas`). Renombrar a ciegas rompe código, tests, variables de entorno y datos persistidos, así que conviene fijar una regla para lo nuevo y registrar la deuda existente sin tocarla.
- Decisión:
  - **Servicios y carpetas:**
    - Los servicios van en `services/`, las aplicaciones de front en `apps/` y la infraestructura en `infra/`.
    - Cada servicio usa el mismo nombre `kc-<nombre>` en su carpeta, su `artifactId` y su `spring.application.name`.
    - El front se llama `lara-web`.
    - Los paquetes Java, los puertos y las rutas HTTP no forman parte de esta regla y no cambian por ella.
  - **Bases de datos:**
    - Una base por servicio, con nombre en `snake_case` y sin guiones.
    - Tablas en español y en `snake_case`.
    - Migraciones Flyway con el nombre `V<n>__create_<tabla>.sql`; una migración ya aplicada no se edita, se corrige con una migración nueva.
    - Volúmenes con el nombre `<servicio>-pgdata`.
    - El nombre del proyecto Compose se fija con `name:` en cada `compose.yaml`, porque de él depende el nombre real del volumen.
  - **Keycloak:**
    - El realm `lab` se mantiene.
    - Los clients nuevos se nombran como el servicio o la app que los usa (`kc-menu`, `lara-web`).
    - Los roles nuevos usan `kebab-case`.
    - No se crean dos roles que solo difieran en el separador (por ejemplo `usar-finanzas` y `usar_finanzas`).
  - **Deuda de nombres actual (no se renombra ahora):**

    | Hoy | Debería ser | Nota |
    | --- | --- | --- |
    | Client `chat-api` | `kc-menu` | `SecurityConfig` de kc-menu lee `resource_access.chat-api.roles`; también lo usan la skill `keycloak-lab` y `estado-lab.md` |
    | Client `agents-ui` | `lara-web` | Lo usan `KeycloakAuthAdapter`, `LoginPage`, los tests de Lara, el mapper de audiencia y `KEYCLOAK_AUDIENCE` del orquestador |
    | Client `chat-front` | Eliminar | Ningún código lo usa; puede seguir existiendo en el realm |
    | Rol de client `usar-finanzas` frente a rol de realm `usar_finanzas` | Unificar en `kebab-case` | `OwnerSubResolver` de kc-finanzas exige `usar-finanzas`; `AppShell.tsx` y sus tests usan `usar_finanzas` |

    Por revisar, fuera de esa lista: el client `finanzas-agent` (no sigue la regla de nombrarlo como el servicio) y el volumen `kc-pgdata` de Keycloak (no sigue `<servicio>-pgdata`; renombrarlo implica migrar datos).
  - **Cuándo se corrige la deuda:** después del export del realm (KC-03), uno por uno. Cada renombre toca código, tests y configuración del realm a la vez, así que va en su propio cambio, con sus pruebas y un plan para el realm existente.
- Alternativas consideradas: renombrar todo de una vez ahora, lo que obliga a tocar a la vez el realm, los servicios, el front, el orquestador y los tests sin un export del realm que permita reproducirlo; y no fijar convención, lo que mantiene los estilos mezclados. Se descartan para evitar roturas y dejar una regla clara desde ahora.
- Consecuencias: lo nuevo nace con nombres coherentes y la deuda queda visible y acotada. Mientras no se haga el renombre, conviven nombres viejos y nuevos (por ejemplo, la carpeta `lara-web` frente al client `agents-ui`) y hay que consultar este ADR antes de asumir que coinciden.
- Estado: Propuesta
