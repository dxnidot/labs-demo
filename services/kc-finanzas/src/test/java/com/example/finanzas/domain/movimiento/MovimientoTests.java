package com.example.finanzas.domain.movimiento;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Comprueba las invariantes principales de un movimiento.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
class MovimientoTests {

    @Test
    @DisplayName("Acepta importes positivos con precisión decimal")
    void acceptsPositiveDecimalAmount() {
        // Arrange
        BigDecimal monto = new BigDecimal("123.45");

        // Act y Assert
        assertDoesNotThrow(() -> movimiento(monto));
    }

    @Test
    @DisplayName("Rechaza importes nulos, cero o negativos")
    void rejectsNonPositiveAmount() {
        // Arrange
        BigDecimal cero = BigDecimal.ZERO;
        BigDecimal negativo = new BigDecimal("-0.01");

        // Act y Assert
        assertThrows(IllegalArgumentException.class, () -> movimiento(cero));
        assertThrows(IllegalArgumentException.class, () -> movimiento(negativo));
        assertThrows(IllegalArgumentException.class, () -> movimiento(null));
    }

    private Movimiento movimiento(BigDecimal monto) {
        return new Movimiento(
                UUID.randomUUID(),
                "usuario-prueba",
                LocalDate.of(2026, 9, 12),
                monto,
                Moneda.MXN,
                "Comercio de prueba",
                "Categoría de prueba",
                null,
                OrigenMovimiento.MANUAL,
                TipoMovimiento.GASTO);
    }
}
