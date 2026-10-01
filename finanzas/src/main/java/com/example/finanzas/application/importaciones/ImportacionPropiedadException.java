package com.example.finanzas.application.importaciones;

/**
 * Indica que el preview pertenece a otro sujeto autenticado.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public class ImportacionPropiedadException extends RuntimeException {

    public ImportacionPropiedadException() {
        super("Importación no pertenece al usuario autenticado");
    }
}
