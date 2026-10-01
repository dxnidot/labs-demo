---
name: finanzas-dominio
description: Reglas de dominio para las funciones de finanzas personales de Lara (calendario de tarjetas, portafolio, aportaciones, rebalanceo y privacidad). Úsala al programar cualquier elemento en finanzas/, las vistas de finanzas de agents-ui/ o las herramientas financieras de agents/.
---

# Dominio de finanzas personales de Lara

Aplica estas reglas al implementar cálculos, herramientas o vistas financieras. Mantén las reglas financieras en el servicio `finanzas/`; las vistas presentan resultados calculados y no duplican cálculos de dominio.

## Cuentas y posiciones

- La cuenta MX opera en MXN y admite solo acciones enteras.
- La cuenta USA opera en USD y admite acciones fraccionarias.
- No mezcles monedas ni sumes importes de monedas distintas.
- La cuenta de liquidez no es una inversión y no cuenta como posición al calcular asignaciones o rebalanceos.

## Aportaciones y rebalanceo

- Asigna primero las aportaciones a posiciones por debajo de su objetivo.
- Nunca fuerces compras en posiciones que ya superan su objetivo.
- No vendas posiciones para rebalancear.
- Informa el efectivo que quede sin asignar.

## Alertas de caída

- Marca una posición cuando su precio esté entre 12 % y 15 % por debajo de su costo promedio (variación de -12 % a -15 %).
- El umbral de alerta debe poder configurarse por usuario.

## Calendario de tarjetas

- La fecha de pago corresponde al mes siguiente al mes de la fecha de corte.
- Si el día de pago no existe en ese mes, usa el último día del mes.
- Ajuste por fin de semana o día feriado: regla pendiente de definir. Por ahora no muevas la fecha de pago y no inventes un estado nuevo.

## Privacidad y recomendaciones

- Los cálculos viven en el servicio `finanzas/`; el LLM recibe únicamente resultados ya calculados.
- Nunca almacenes números completos de tarjeta; conserva solo los últimos cuatro dígitos.
- Los datos reales solo pueden residir en la base de datos o en `agents/data/`; no los incluyas en código, prompts, logs, pruebas, ejemplos ni documentación pública.
- El repositorio es público: usa únicamente reglas y ejemplos genéricos, sin posiciones, importes, objetivos, ni nombres reales de intermediarios financieros o entidades bancarias.
- Presenta las recomendaciones como educativas, no como asesoría financiera personalizada.
