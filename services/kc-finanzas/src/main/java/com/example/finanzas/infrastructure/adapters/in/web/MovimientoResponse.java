package com.example.finanzas.infrastructure.adapters.in.web;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.example.finanzas.domain.movimiento.Moneda;
import com.example.finanzas.domain.movimiento.Movimiento;
import com.example.finanzas.domain.movimiento.OrigenMovimiento;
import com.example.finanzas.domain.movimiento.TipoMovimiento;

/**
 * Expone los datos del movimiento sin información interna del propietario.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public record MovimientoResponse(
        UUID id,
        LocalDate fecha,
        BigDecimal monto,
        Moneda moneda,
        String comercio,
        String categoria,
        UUID tarjetaId,
        OrigenMovimiento origen,
        TipoMovimiento tipo) {

    public static MovimientoResponse desde(Movimiento movimiento) {
        return new MovimientoResponse(
                movimiento.id(),
                movimiento.fecha(),
                movimiento.monto(),
                movimiento.moneda(),
                movimiento.comercio(),
                movimiento.categoria(),
                movimiento.tarjetaId(),
                movimiento.origen(),
                movimiento.tipo());
    }
}
