package com.example.finanzas.domain.movimiento;

import java.math.BigDecimal;

/**
 * Contiene el total mensual de una categoría para un tipo y moneda.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public record ResumenCategoria(String categoria, TipoMovimiento tipo, Moneda moneda, BigDecimal total) {
}
