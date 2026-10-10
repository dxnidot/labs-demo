package com.example.finanzas.infrastructure.adapters.out.memory;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.example.finanzas.application.importaciones.ImportacionNoEncontradaException;
import com.example.finanzas.application.importaciones.ImportacionPreview;
import com.example.finanzas.application.importaciones.ImportacionPropiedadException;
import com.example.finanzas.application.importaciones.MovimientoImportado;
import com.example.finanzas.domain.movimiento.Moneda;
import com.example.finanzas.domain.movimiento.TipoMovimiento;

/**
 * Verifica aislamiento por sujeto, expiración y consumo único de previews.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
class InMemoryImportacionPreviewStoreTests {

    @Test
    @DisplayName("Permite consumir una sola vez y solo al sujeto propietario")
    void consumesOnceAndOnlyForOwner() {
        // Arrange
        InMemoryImportacionPreviewStore store = new InMemoryImportacionPreviewStore(
                Clock.fixed(Instant.parse("2026-09-30T12:00:00Z"), ZoneId.of("UTC")));
        List<MovimientoImportado> movimientos = List.of(movimiento());
        UUID importId = store.guardar("sub-propio", movimientos);

        // Act / Assert
        assertThrows(ImportacionPropiedadException.class, () -> store.consumir(importId, "sub-ajeno"));
        ImportacionPreview preview = store.consumir(importId, "sub-propio");
        assertEquals(importId, preview.importId());
        assertEquals(movimientos, preview.movimientos());
        assertThrows(ImportacionNoEncontradaException.class, () -> store.consumir(importId, "sub-propio"));
    }

    @Test
    @DisplayName("Invalida el preview al cumplirse quince minutos")
    void expiresAfterFifteenMinutes() {
        // Arrange
        MutableClock reloj = new MutableClock(Instant.parse("2026-09-30T12:00:00Z"));
        InMemoryImportacionPreviewStore store = new InMemoryImportacionPreviewStore(reloj);
        UUID importId = store.guardar("sub-propio", List.of(movimiento()));
        reloj.avanzar(Duration.ofMinutes(15));

        // Act / Assert
        assertThrows(ImportacionNoEncontradaException.class, () -> store.consumir(importId, "sub-propio"));
    }

    private MovimientoImportado movimiento() {
        return new MovimientoImportado(
                java.time.LocalDate.of(2026, 9, 30),
                new BigDecimal("12.50"),
                Moneda.MXN,
                "Comercio demo",
                "Comida",
                null,
                TipoMovimiento.GASTO);
    }

    private static final class MutableClock extends Clock {

        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        private void avanzar(Duration duracion) {
            instant = instant.plus(duracion);
        }

        @Override
        public ZoneId getZone() {
            return ZoneId.of("UTC");
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
