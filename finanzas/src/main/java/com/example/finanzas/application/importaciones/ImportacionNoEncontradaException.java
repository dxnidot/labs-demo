package com.example.finanzas.application.importaciones;

/**
 * Indica que el preview no existe, expiró o ya fue consumido.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public class ImportacionNoEncontradaException extends RuntimeException {

    public ImportacionNoEncontradaException() {
        super("Importación no encontrada");
    }
}
