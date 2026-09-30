# FE-01 · Menú por rol dentro de Lara y retiro de kc-front Angular

- Estado: Pendiente
- Prioridad: Media
- Parte del lab: Frontend
- Depende de: UI-04
- Fecha: 2026-09-30
- Contexto: El menú de la app debe decidirse por el rol del usuario y evitar la duplicación con una UI Angular legacy. Esto limpia la rama principal y hace que Lara se convierta en el único front del laboratorio.
- Criterio de aceptación:
  - `grep -R "rol\|role\|perfil\|menu" kc-front/src/app` y `grep -R "rol\|role\|perfil\|menu" agents` muestran la lógica de permisos centralizada.
  - La app no vuelve a cargar un segundo front Angular cuando Lara representa la última versión del producto.
  - `git diff -- .` muestra que la carpeta Angular legacy queda deshabilitada o retirada del flujo principal del lab.
- Archivos relevantes:
  - kc-front/
  - agents/
  - docs/backlog/
- Notas:
  - Confirmado: la consolidación de Lara es un cambio de frontend, no solo de estilo.
  - Inferido: el rol del usuario debe validar el acceso a opciones del menú antes de mostrarlas.
  - Pendiente: revisar si la base de frontend final usa Angular o ya se desplaza a una UI más ligera en otro framework.
