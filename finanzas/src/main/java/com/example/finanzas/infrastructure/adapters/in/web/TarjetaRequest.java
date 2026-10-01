package com.example.finanzas.infrastructure.adapters.in.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Recibe datos permitidos para crear o reemplazar una tarjeta.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public record TarjetaRequest(
        @NotBlank @Size(max = 100) String alias,
        @NotBlank @Pattern(regexp = "[0-9]{4}") String ultimos4,
        @Min(1) @Max(31) int diaCorte,
        @Min(1) @Max(31) int diaPago,
        boolean permiteLiquidarMsiAnticipado,
        boolean activa) {
}
