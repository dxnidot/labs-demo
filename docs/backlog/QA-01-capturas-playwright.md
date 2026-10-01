# QA-01 · Capturas automáticas con Playwright para ui-reviewer

- Estado: Pendiente
- Prioridad: Baja
- Parte del lab: C.5
- Depende de: UI-08
- Fecha: 2026-09-30
- Contexto: El subagente `ui-reviewer` compara el código contra las maquetas, pero no ve la app en ejecución salvo que alguien guarde capturas a mano en `.capturas/`. Generarlas con Playwright permitiría revisar cada pantalla en varios anchos sin trabajo manual.
- Criterio de aceptación:
  - Un comando en `agents-ui/` genera una captura por pantalla 01–14 en `.capturas/` a 320, 375, 768 y 1280 px.
  - Las capturas usan datos de ejemplo, nunca datos reales, y `.capturas/` sigue ignorado por Git.
  - `ui-reviewer` puede leer las capturas sin pasos manuales.
- Archivos relevantes:
  - agents-ui/
  - .claude/agents/ui-reviewer.md
- Notas:
  - Confirmado: Playwright no está instalado en `agents-ui/` al 2026-09-30.
  - Pendiente: decidir cómo se simula la sesión de Keycloak y las APIs para las capturas.
