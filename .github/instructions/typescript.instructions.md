---
applyTo: "**/*.ts,**/*.tsx"
---

- En `agents-ui`, usa componentes React funcionales y hooks; mantén los tipos estrictos y no uses `any`.
- En `kc-front`, conserva el estilo Angular existente y no agregues funcionalidades.
- Para tokens y datos de API o agentes, aplica las reglas de seguridad globales de `.github/copilot-instructions.md`.
- Solo en archivos nuevos que exporten un componente, hook, port, adapter o use case, añade un bloque JSDoc al inicio del export principal con un propósito de una línea, `@author Daniel Tovar` y `@since YYYY-MM-DD`.
- Al editar un archivo existente, no cambies `@author`; añade o actualiza `@modified Daniel Tovar YYYY-MM-DD` con una nota breve.
- No añadas JSDoc a helpers pequeños, tipos de props ni funciones cuyo nombre ya explique su propósito.