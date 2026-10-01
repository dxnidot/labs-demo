package com.example.finanzas.infrastructure.adapters.in.web;

import java.util.List;
import java.util.UUID;

/**
 * Respuesta del preview de importación CSV.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public record ImportacionPreviewResponse(
        UUID importId,
        int totalRegistros,
        List<MovimientoImportadoResponse> movimientos) {
}
