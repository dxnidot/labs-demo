---
applyTo: "**/*.java"
---

- Usa JUnit 5 y Mockito; estructura las pruebas con Arrange, Act, Assert (AAA).
- Añade `@DisplayName` a las pruebas y usa `assertThrows` o `assertDoesNotThrow` para verificar excepciones.
- Prefiere inyección por constructor y no uses Lombok.
- Cada clase debe tener Javadoc con el propósito en una línea, `@author` y `@since`; al editar una clase existente, actualiza `@modified`.