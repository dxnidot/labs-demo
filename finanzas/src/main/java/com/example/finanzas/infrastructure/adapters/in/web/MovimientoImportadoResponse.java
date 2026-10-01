package com.example.finanzas.infrastructure.adapters.in.web;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.example.finanzas.application.importaciones.MovimientoImportado;
import com.example.finanzas.domain.movimiento.Moneda;
import com.example.finanzas.domain.movimiento.TipoMovimiento;

/**
 * Representa los datos de preview sin identificador persistente ni propietario.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public record MovimientoImportadoResponse(
        LocalDate fecha,
        BigDecimal monto,
        Moneda moneda,
        String comercio,
        String categoria,
        UUID tarjetaId,
        TipoMovimiento tipo) {

    public static MovimientoImportadoResponse desde(MovimientoImportado movimiento) {
        return new MovimientoImportadoResponse(
                movimiento.fecha(),
                movimiento.monto(),
                movimiento.moneda(),
                movimiento.comercio(),
                movimiento.categoria(),
                movimiento.tarjetaId(),
                movimiento.tipo());
    }
}
