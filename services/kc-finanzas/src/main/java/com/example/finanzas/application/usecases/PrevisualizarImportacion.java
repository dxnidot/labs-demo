package com.example.finanzas.application.usecases;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.finanzas.application.importaciones.MovimientoImportado;
import com.example.finanzas.application.ports.ImportacionPreviewStore;

/**
 * Crea un preview temporal para el sujeto autenticado sin persistir movimientos.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Service
public class PrevisualizarImportacion {

    private static final int MAX_REGISTROS = 1000;

    private final ImportacionPreviewStore previewStore;

    public PrevisualizarImportacion(ImportacionPreviewStore previewStore) {
        this.previewStore = previewStore;
    }

    public UUID ejecutar(String ownerSub, List<MovimientoImportado> movimientos) {
        if (ownerSub == null || ownerSub.isBlank()
                || movimientos == null || movimientos.isEmpty() || movimientos.size() > MAX_REGISTROS) {
            throw new IllegalArgumentException("Importación inválida");
        }
        return previewStore.guardar(ownerSub, movimientos);
    }
}
