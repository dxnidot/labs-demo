package com.example.finanzas.infrastructure.adapters.in.web;

import java.math.BigDecimal;

import com.example.finanzas.domain.movimiento.Moneda;
import com.example.finanzas.domain.movimiento.ResumenCategoria;
import com.example.finanzas.domain.movimiento.TipoMovimiento;

/**
 * Representa el total calculado de una categoría para un tipo y moneda.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public record ResumenCategoriaResponse(String categoria, TipoMovimiento tipo, Moneda moneda, BigDecimal total) {

    public static ResumenCategoriaResponse desde(ResumenCategoria resumen) {
        return new ResumenCategoriaResponse(
                resumen.categoria(), resumen.tipo(), resumen.moneda(), resumen.total());
    }
}
