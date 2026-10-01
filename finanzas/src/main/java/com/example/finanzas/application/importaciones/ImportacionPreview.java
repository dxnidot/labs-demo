package com.example.finanzas.application.importaciones;

import java.util.List;
import java.util.UUID;

/**
 * Preview volátil, asociado a un identificador y sin persistencia financiera.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public record ImportacionPreview(UUID importId, List<MovimientoImportado> movimientos) {

    public ImportacionPreview {
        movimientos = List.copyOf(movimientos);
    }
}
