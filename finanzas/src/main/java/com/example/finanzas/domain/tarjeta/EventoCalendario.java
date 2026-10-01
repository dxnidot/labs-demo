package com.example.finanzas.domain.tarjeta;

import java.time.LocalDate;

/**
 * Describe una fecha de corte o pago de una tarjeta.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public record EventoCalendario(LocalDate fecha, TipoEvento tipo, String alias) {
}
