package com.example.finanzas.domain.tarjeta;

import java.util.UUID;

/**
 * Representa una tarjeta sin almacenar su número completo.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public record Tarjeta(
        UUID id,
        String ownerSub,
        String alias,
        String ultimos4,
        int diaCorte,
        int diaPago,
        boolean permiteLiquidarMsiAnticipado,
        boolean activa) {

    public Tarjeta {
        if (id == null) {
            throw new IllegalArgumentException("El identificador es obligatorio");
        }
        if (ownerSub == null || ownerSub.isBlank()) {
            throw new IllegalArgumentException("El propietario es obligatorio");
        }
        if (alias == null || alias.isBlank() || alias.length() > 100) {
            throw new IllegalArgumentException("El alias debe tener entre 1 y 100 caracteres");
        }
        if (ultimos4 == null || !ultimos4.matches("[0-9]{4}")) {
            throw new IllegalArgumentException("Los últimos cuatro dígitos deben contener exactamente 4 números");
        }
        if (diaCorte < 1 || diaCorte > 31) {
            throw new IllegalArgumentException("El día de corte debe estar entre 1 y 31");
        }
        if (diaPago < 1 || diaPago > 31) {
            throw new IllegalArgumentException("El día de pago debe estar entre 1 y 31");
        }
    }
}
