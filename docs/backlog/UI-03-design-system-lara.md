# UI-03 · Design system de Lara: tokens y componentes base

- Estado: Hecho
- Prioridad: Media
- Parte del lab: UI
- Depende de: DOC-02
- Fecha: 2026-09-30
- Contexto: Lara necesita un sistema visual consistente para que los componentes del chat, el login y los paneles del agente no se vuelvan ad hoc. Esto acelera trabajo, mejora coherencia y reduce errores de estilo.
- Criterio de aceptación:
  - `find kc-front/src -type f | grep -E "styles|theme|components"` devuelve la estructura del design system con tokens y componentes base.
  - `grep -R "--color\|--spacing\|border-radius\|tokens" kc-front/src` demuestra la definición de tokens.
  - `npm run build` de la app termina con éxito utilizando los componentes base del design system.
- Archivos relevantes:
  - kc-front/src/
  - docs/design/
- Notas:
  - Confirmado: el sistema visual debe ser reutilizable y consistente.
  - Confirmado: tokens Tailwind v4 y componentes base implementados en agents-ui/.
  - Inferido: los componentes base deben quedar separados de la lógica del negocio.
  - Cerrado: 2026-09-30
