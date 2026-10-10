package com.example.finanzas.domain.movimiento;

/**
 * Señala que un movimiento no existe para el propietario solicitado.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public class MovimientoNoEncontradoException extends RuntimeException {

    public MovimientoNoEncontradoException() {
        super("Movimiento no encontrado");
    }
}
