package com.example.finanzas.domain.movimiento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Representa un movimiento perteneciente a un sujeto autenticado.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public record Movimiento(
        UUID id,
        String ownerSub,
        LocalDate fecha,
        BigDecimal monto,
        Moneda moneda,
        String comercio,
        String categoria,
        UUID tarjetaId,
        OrigenMovimiento origen,
        TipoMovimiento tipo) {

    public Movimiento {
        if (id == null) {
            throw new IllegalArgumentException("El identificador es obligatorio");
        }
        if (ownerSub == null || ownerSub.isBlank()) {
            throw new IllegalArgumentException("El propietario es obligatorio");
        }
        if (fecha == null) {
            throw new IllegalArgumentException("La fecha es obligatoria");
        }
        if (monto == null || monto.signum() <= 0) {
            throw new IllegalArgumentException("El monto debe ser positivo");
        }
        if (moneda == null || origen == null || tipo == null) {
            throw new IllegalArgumentException("Moneda, origen y tipo son obligatorios");
        }
        if (comercio == null || comercio.isBlank() || comercio.length() > 150) {
            throw new IllegalArgumentException("El comercio debe tener entre 1 y 150 caracteres");
        }
        if (categoria == null || categoria.isBlank() || categoria.length() > 100) {
            throw new IllegalArgumentException("La categoría debe tener entre 1 y 100 caracteres");
        }
    }
}
