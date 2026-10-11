# Documentación del lab

Este directorio guarda la parte publicable del proyecto y del laboratorio.

## Estructura

- `snapshot-<fecha>.md`: estado vivo y resumido del proyecto (se reemplaza, no se acumula). Punto de partida de la memoria vectorizada.
- `design/`: guía visual activa de Lara (tokens, mockups PNG/HTML). Manda sobre cualquier skill de diseño.
- `archive/`: historial completo movido fuera de la ruta activa — `backlog/` (historias), `decisions/` (ADRs), `plans/` (planes cerrados), `bugs/` (incidencias corregidas).

El detalle histórico (por qué se tomó cada decisión, el estado exacto de cada historia) vive en `archive/`; para trabajar día a día basta con el snapshot y, pronto, la búsqueda semántica sobre `archive/` + este directorio.

## Reglas

- Mantener un archivo por tema.
- Mantener los documentos en español cuando se trate del flujo del lab.
- No guardar secretos, tokens, credenciales, nombres internos ni datos del banco.
- Cuando algo esté cerrado, moverlo a `archive/` en vez de borrarlo.
