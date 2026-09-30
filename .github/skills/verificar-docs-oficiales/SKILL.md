---
name: verificar-docs-oficiales
description: Verifica recomendaciones, comandos, comparaciones y afirmaciones técnicas con fuentes oficiales o repositorios confiables. Si la dependencia está instalada localmente, inspecciona primero su código fuente y contrástalo con la documentación oficial. Úsalo para tecnologías con documentación pública; no se activa para preguntas puramente conceptuales sin afirmaciones verificables.
---

# Verificar documentación oficial o repos antes de responder

## Regla núcleo

Antes de dar cualquier instrucción técnica, comando, paso a paso, comparación entre herramientas, o afirmación sobre cómo se comporta una tecnología, el asistente debe verificar contra una fuente confiable — nunca responder solo de memoria de entrenamiento.

## Orden de búsqueda para temas de programación

Cuando la pregunta es específicamente de programación (lenguajes, frameworks, librerías, paquetes de npm/pip/maven, APIs de código, herramientas de desarrollo), seguir este orden estricto, deteniéndose en el primer paso que dé una respuesta confiable:

0. **Si hay un proyecto local con la dependencia ya instalada** (ej. una carpeta `.venv`, `node_modules`, `vendor`, o cualquier entorno donde la librería/framework en cuestión ya está presente en disco): revisar primero el **código fuente instalado realmente** (los archivos `.py`, `.ts`, `.java`, etc. de la librería, no solo su documentación). Esta es la fuente más confiable de todas porque es literalmente lo que se va a ejecutar en esa máquina — puede haber diferencias entre la versión instalada y lo que dice la documentación más reciente en la web. Confirmar la firma exacta de funciones, parámetros disponibles, y comportamiento real ahí antes de dar cualquier ejemplo de código.
1. **Documentación oficial del proyecto/framework** — ej. `docs.python.org`, `typescriptlang.org/docs`, `docs.spring.io`, `cloud.google.com` para ADK, la doc propia de OpenClaw. Si el paso 0 aplicó, usar este paso para CONTRASTAR contra el código instalado: confirmar que el comportamiento visto en el código coincide con el uso recomendado/documentado, y señalar explícitamente si hay una discrepancia entre lo que dice la doc y lo que el código instalado realmente hace (ej. una versión desactualizada, un comportamiento experimental no documentado aún).
2. **Si no hay doc oficial clara, o la pregunta es sobre comportamiento de código específico**, ir al **repositorio oficial en GitHub** (README, releases, issues recientes, código fuente en la rama principal — para comparar contra lo que se tiene instalado localmente si aplica el paso 0).
3. **Si ninguno de los anteriores resuelve la duda**, recurrir a búsqueda web general — prefiriendo fuentes originales (blogs oficiales del proyecto, papers, changelogs) sobre agregadores o foros de terceros cuando aparezcan en los resultados.
4. **npmx.dev como último recurso / referencia complementaria, NO como primera opción**: es un proyecto en beta (hosteado en Vercel) con la intención de convertirse en un punto de documentación oficial para distintas cosas de programación, pero de momento no es una fuente consolidada ni confiable como primera parada. Solo consultarlo si los pasos 1-3 no dieron respuesta y como dato adicional a contrastar, dejando claro en la respuesta que viene de una fuente en beta.

Cuando el paso 0 aplica, siempre citar la ruta y línea exacta del archivo revisado (ej. `llm_agent.py:440-570`) como parte de la fuente declarada, en lugar de una referencia genérica a "la documentación".

## Orden de búsqueda para temas NO estrictamente de programación

Para tecnologías que no son paquetes de código (ej. servicios de infraestructura, plataformas cloud en general, herramientas de línea de comandos sin paquete de npm/pip asociado, terminales como Warp, sistemas operativos): documentación oficial primero, luego repo si aplica, luego búsqueda web directa — sin pasar por npmx.dev, que no aplica a estos casos.

## Nunca responder solo de memoria cuando la pregunta implica

- Instalación o configuración (comandos, versiones, requisitos)
- Comparación entre dos tecnologías o frameworks
- Comportamiento específico de una API, librería o CLI
- Compatibilidad de versiones
- Cualquier afirmación que pueda influir en una decisión técnica o de arquitectura

## Declarar la fuente

Decir de forma práctica: "según la documentación oficial de X", "confirmado en el repo de Y", o "según la ficha del paquete en npmx.dev/npmjs.com". Si algo no se pudo verificar contra ninguna fuente, decirlo abiertamente en vez de presentarlo como hecho.

## Señal visible de activación

Para indicar cuándo la respuesta se apoyó principalmente en internet general (no en una fuente directa de confianza), iniciar la respuesta con 🌍 únicamente cuando la fuente PRINCIPAL fue búsqueda web general (Google u otro buscador) o npmx.dev — es decir, los pasos 3-4 del orden de búsqueda, o el paso equivalente para temas no estrictamente de programación.

- **Con 🌍** — la fuente principal fue búsqueda web general o npmx.dev.
- **Sin icono** — la fuente principal fue documentación oficial, código fuente instalado localmente, o el repositorio oficial en GitHub (pasos 0-2). Estas ya son fuentes de confianza directa y no requieren alerta.
- **Sin icono** — tampoco cuando no se encontró confirmación en ninguna fuente (ver "Qué hacer si no se encuentra la fuente"): ese caso ya se declara explícitamente en el texto, no necesita un icono aparte.

Si se combinaron varias fuentes y la web general solo fue complementaria (el paso 0-2 ya dio la respuesta principal), no usar 🌍.

## Separar siempre

- **Confirmado** — lo que la doc oficial, el repo, o npmx.dev dicen literalmente
- **Inferido** — una conclusión razonable que el asistente saca combinando información, pero que no está dicha textualmente en la fuente
- **Pendiente de validar** — lo que todavía requiere confirmación en el entorno concreto (ej. configuración de red o versión interna)

## Caso especial: OpenClaw

Para OpenClaw específicamente, consultar primero la documentación oficial de OpenClaw y después el repositorio oficial de GitHub — nunca inventar. Esta regla aplica la misma disciplina a cualquier otra tecnología, con el orden de búsqueda detallado arriba para temas de programación.

## Formato de respuesta

Mantener un estilo de respuesta profesional y directo:

- Separar por microservicio/componente cuando aplique
- Dar estatus, impacto y siguiente paso
- Proponer primero la opción más simple y mantenible
- Al comparar opciones, decir cuál conviene más y por qué
- Aclarar si el contexto es local, dev o QA
- Mensajes breves, profesionales y directos

## Qué hacer si no se encuentra la fuente

Si se agotó el orden de búsqueda completo (doc oficial → repo → web → npmx.dev como último recurso) sin encontrar confirmación confiable:

- Decirlo explícitamente: "no encontré esto confirmado en documentación oficial, repo, ni búsqueda web — esto es lo que sé por conocimiento general, tómalo con reserva"
- Nunca presentar una suposición como si fuera un hecho verificado
- Sugerir dónde más buscar (issues de GitHub, Discord/foro oficial, changelog) si aplica
