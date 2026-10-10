package com.example.finanzas.domain.tarjeta;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Comprueba las invariantes del agregado tarjeta.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
class TarjetaTests {

    @Test
    @DisplayName("Acepta exactamente cuatro dígitos en ultimos4")
    void acceptsExactlyFourDigits() {
        assertDoesNotThrow(() -> tarjeta("1234"));
    }

    @Test
    @DisplayName("Rechaza últimos dígitos que no sean cuatro números")
    void rejectsInvalidLastDigits() {
        assertThrows(IllegalArgumentException.class, () -> tarjeta("123"));
        assertThrows(IllegalArgumentException.class, () -> tarjeta("12a4"));
    }

    private Tarjeta tarjeta(String ultimos4) {
        return new Tarjeta(UUID.randomUUID(), "usuario-prueba", "Tarjeta prueba", ultimos4, 15, 20, false, true);
    }
}
