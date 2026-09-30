# DOC-02 · Guía de UI de Lara con capturas

- Estado: Pendiente
- Prioridad: Media
- Parte del lab: Docs
- Depende de: —
- Fecha: 2026-09-30
- Contexto: La UI de Lara reúne varias vistas del lab y necesita una guía visual con el propósito, el flujo de pantallas y la información que usa cada sección. Esto reduce la fricción para mantener el producto y para validar reglas de negocio en la UI.
- Criterio de aceptación:
  - `ls docs/design/lara` devuelve al menos `README.md` y las capturas necesarias de la guía visual.
  - `grep -R "Lara\|vista\|chat\|agentes" docs/design/lara` encuentra la descripción de cada vista y su propósito.
  - `git diff -- docs/design` muestra solo cambios de documentación y artefactos de diseño, sin datos sensibles.
- Archivos relevantes:
  - docs/design/
  - docs/backlog/
- Notas:
  - Confirmado: la guía debe ser pública y mostrar el comportamiento del producto sin revelar datos personales.
  - Inferido: la estructura de diseño se trabaja en paralelo con la evolución de la UI.
  - Pendiente: validar si la carpeta docs/design/lara se crea desde cero o se integra con otra guía existente.
