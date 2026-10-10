package com.example.finanzas.infrastructure.adapters.in.web;

import java.time.LocalDate;

import com.example.finanzas.domain.tarjeta.EventoCalendario;
import com.example.finanzas.domain.tarjeta.TipoEvento;

/**
 * Representa un evento de corte o pago en la respuesta HTTP.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public record EventoCalendarioResponse(LocalDate fecha, TipoEvento tipo, String alias) {

    public static EventoCalendarioResponse desde(EventoCalendario evento) {
        return new EventoCalendarioResponse(evento.fecha(), evento.tipo(), evento.alias());
    }
}
