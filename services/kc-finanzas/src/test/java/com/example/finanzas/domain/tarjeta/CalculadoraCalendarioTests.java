package com.example.finanzas.domain.tarjeta;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Verifica reglas de fechas del calendario con resultados definidos manualmente.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
class CalculadoraCalendarioTests {

    private final CalculadoraCalendario calculadora = new CalculadoraCalendario();

    @Test
    @DisplayName("Ajusta el corte al fin de febrero y paga el mes siguiente")
    void adjustsMonthEndAndPaysInFollowingMonth() {
        Tarjeta tarjeta = tarjeta("Oro", 31, 5, true);

        List<EventoCalendario> eventos = calculadora.calcular(
                List.of(tarjeta),
                LocalDate.of(2027, 1, 31),
                29);

        assertEquals(List.of(
                new EventoCalendario(LocalDate.of(2027, 1, 31), TipoEvento.CORTE, "Oro"),
                new EventoCalendario(LocalDate.of(2027, 2, 5), TipoEvento.PAGO, "Oro"),
                new EventoCalendario(LocalDate.of(2027, 2, 28), TipoEvento.CORTE, "Oro")), eventos);
    }

    @Test
    @DisplayName("Incluye el pago de enero derivado del corte de diciembre")
    void includesPaymentFromPreviousMonthAndYearChange() {
        Tarjeta tarjeta = tarjeta("Viajes", 31, 5, true);

        List<EventoCalendario> eventos = calculadora.calcular(
                List.of(tarjeta),
                LocalDate.of(2027, 1, 1),
                5);

        assertEquals(List.of(
                new EventoCalendario(LocalDate.of(2027, 1, 5), TipoEvento.PAGO, "Viajes")), eventos);
    }

    @Test
    @DisplayName("Ordena eventos y excluye tarjetas inactivas")
    void sortsEventsAndExcludesInactiveCards() {
        Tarjeta activa = tarjeta("Azul", 10, 15, true);
        Tarjeta inactiva = tarjeta("Verde", 10, 15, false);

        List<EventoCalendario> eventos = calculadora.calcular(
                List.of(inactiva, activa),
                LocalDate.of(2027, 3, 10),
                6);

        assertEquals(List.of(
                new EventoCalendario(LocalDate.of(2027, 3, 10), TipoEvento.CORTE, "Azul"),
                new EventoCalendario(LocalDate.of(2027, 3, 15), TipoEvento.PAGO, "Azul")), eventos);
    }

    @Test
    @DisplayName("Maneja el cambio de año en la fecha de pago")
    void calculatesPaymentAtYearBoundary() {
        Tarjeta tarjeta = tarjeta("Clasica", 31, 5, true);

        List<EventoCalendario> eventos = calculadora.calcular(
                List.of(tarjeta),
                LocalDate.of(2026, 12, 31),
                6);

        assertEquals(List.of(
                new EventoCalendario(LocalDate.of(2026, 12, 31), TipoEvento.CORTE, "Clasica"),
                new EventoCalendario(LocalDate.of(2027, 1, 5), TipoEvento.PAGO, "Clasica")), eventos);
    }

    private Tarjeta tarjeta(String alias, int diaCorte, int diaPago, boolean activa) {
        return new Tarjeta(
                UUID.randomUUID(),
                "usuario-prueba",
                alias,
                "1234",
                diaCorte,
                diaPago,
                false,
                activa);
    }
}
