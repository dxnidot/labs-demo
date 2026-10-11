# CP-02 · Probar test-engineer, keycloak-security y skill keycloak-lab (A.2)

- Estado: Pendiente
- Prioridad: Media
- Parte del lab: A.2
- Depende de: CP-01, API-01
- Fecha: 2026-09-30
- Contexto: Las instrucciones y skills de Copilot deben validarse con tareas reales del laboratorio. La prueba cubre la generación de pruebas, la auditoría de seguridad y la guía de levantamiento del entorno.
- Criterio de aceptación:
  - `mvn test` en kc-demo pasa con la suite de pruebas del servicio de menú, sin deshabilitar validaciones.
  - `grep -R "roles\|audiencia\|least privilege\|resource_access" kc-demo/src/main/java` evidencia la revisión de seguridad en la configuración del proyecto.
  - `grep -R "keycloak-lab\|ana\|beto\|8080\|4200" .github` confirma que la skill propuesta quedó documentada y puede usarse con la guía del lab.
- Archivos relevantes:
  - .github/
  - kc-demo/src/main/java/
  - kc-demo/src/test/java/
- Notas:
  - Confirmado: la validación de Copilot se debe apoyar en tareas reales del proyecto, no en ejemplos aislados.
  - Inferido: la guía de levantamiento del laboratiorio necesita la skill keycloak-lab para ser consistente.
  - Pendiente: revisar la respuesta exacta del agente para asegurar que no se excede el dominio del proyecto.
