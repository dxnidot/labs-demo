package com.example.finanzas.application.ports;

import java.util.List;
import java.util.UUID;

import com.example.finanzas.application.importaciones.ImportacionPreview;
import com.example.finanzas.application.importaciones.MovimientoImportado;

/**
 * Almacén volátil de previews de importación ligados al propietario.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public interface ImportacionPreviewStore {

    UUID guardar(String ownerSub, List<MovimientoImportado> movimientos);

    ImportacionPreview consumir(UUID importId, String ownerSub);
}
