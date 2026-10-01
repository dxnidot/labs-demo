package com.example.finanzas.domain.tarjeta;

/**
 * Indica que una tarjeta no existe o no pertenece al propietario autenticado.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public class TarjetaNoEncontradaException extends RuntimeException {

    public TarjetaNoEncontradaException() {
        super("Tarjeta no encontrada");
    }
}
