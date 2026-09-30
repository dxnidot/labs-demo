# AG-06 · MCP filesystem de solo lectura en sandbox (B.6)

- Estado: Pendiente
- Prioridad: Baja
- Parte del lab: B.6
- Depende de: AG-01
- Fecha: 2026-09-30
- Contexto: El agente debe tener acceso a archivos de forma controlada para probar herramientas de filesystem sin riesgos de escritura. Esta capa sirve como ejemplo de sandbox usando lectura limitada y rutas controladas.
- Criterio de aceptación:
  - `grep -R "read-only\|sandbox\|filesystem\|mcp" agents` encuentra la configuración de acceso de solo lectura.
  - Intentar escribir fuera del sandbox devuelve un error explícito del sistema.
  - Un comando de lectura válida en la ruta permitida devuelve contenido sin fallos.
- Archivos relevantes:
  - agents/
  - .gitignore
- Notas:
  - Confirmado: el acceso debe ser estrictamente de solo lectura.
  - Inferido: la configuración del sandbox debe mantenerse en una ruta separada del repo público.
  - Pendiente: validar la configuración exacta del servidor MCP según la versión de ADK.
