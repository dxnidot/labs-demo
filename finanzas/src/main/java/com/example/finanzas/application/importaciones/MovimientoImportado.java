package com.example.finanzas.application.importaciones;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.example.finanzas.domain.movimiento.Moneda;
import com.example.finanzas.domain.movimiento.TipoMovimiento;

/**
 * Datos validados de una fila CSV, aún no persistidos como movimiento.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public record MovimientoImportado(
        LocalDate fecha,
        BigDecimal monto,
        Moneda moneda,
        String comercio,
        String categoria,
        UUID tarjetaId,
        TipoMovimiento tipo) {

    public MovimientoImportado {
        if (fecha == null || monto == null || monto.signum() <= 0
                || moneda == null || tipo == null) {
            throw new IllegalArgumentException("Datos financieros inválidos");
        }
        if (comercio == null || comercio.isBlank() || comercio.length() > 150
                || categoria == null || categoria.isBlank() || categoria.length() > 100) {
            throw new IllegalArgumentException("Comercio o categoría inválidos");
        }
    }
}
