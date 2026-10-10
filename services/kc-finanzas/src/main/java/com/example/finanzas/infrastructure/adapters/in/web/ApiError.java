package com.example.finanzas.infrastructure.adapters.in.web;

/**
 * Describe un error HTTP sin repetir datos confidenciales de la solicitud.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public record ApiError(String mensaje) {
}
