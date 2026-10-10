package com.example.finanzas.infrastructure.adapters.in.web;

import java.util.UUID;

import com.example.finanzas.domain.tarjeta.Tarjeta;

/**
 * Expone los campos públicos de una tarjeta, sin datos del propietario.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public record TarjetaResponse(
        UUID id,
        String alias,
        String ultimos4,
        int diaCorte,
        int diaPago,
        boolean permiteLiquidarMsiAnticipado,
        boolean activa) {

    public static TarjetaResponse desde(Tarjeta tarjeta) {
        return new TarjetaResponse(
                tarjeta.id(),
                tarjeta.alias(),
                tarjeta.ultimos4(),
                tarjeta.diaCorte(),
                tarjeta.diaPago(),
                tarjeta.permiteLiquidarMsiAnticipado(),
                tarjeta.activa());
    }
}
