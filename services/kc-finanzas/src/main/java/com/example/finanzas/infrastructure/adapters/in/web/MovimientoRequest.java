package com.example.finanzas.infrastructure.adapters.in.web;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import com.example.finanzas.domain.movimiento.Moneda;
import com.example.finanzas.domain.movimiento.OrigenMovimiento;
import com.example.finanzas.domain.movimiento.TipoMovimiento;

/**
 * Recibe únicamente los campos modificables de un movimiento, nunca su propietario.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public record MovimientoRequest(
        @NotNull LocalDate fecha,
        @NotNull @Positive BigDecimal monto,
        @NotNull Moneda moneda,
        @NotBlank @Size(max = 150) String comercio,
        @NotBlank @Size(max = 100) String categoria,
        UUID tarjetaId,
        @NotNull OrigenMovimiento origen,
        @NotNull TipoMovimiento tipo) {
}
