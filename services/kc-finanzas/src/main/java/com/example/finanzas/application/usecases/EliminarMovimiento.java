package com.example.finanzas.application.usecases;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.finanzas.application.ports.MovimientoRepository;
import com.example.finanzas.domain.movimiento.MovimientoNoEncontradoException;

/**
 * Elimina un movimiento solo cuando pertenece al sujeto autenticado.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Service
public class EliminarMovimiento {

    private final MovimientoRepository movimientoRepository;

    public EliminarMovimiento(MovimientoRepository movimientoRepository) {
        this.movimientoRepository = movimientoRepository;
    }

    public void ejecutar(UUID id, String ownerSub) {
        if (!movimientoRepository.eliminarPorIdYPropietario(id, ownerSub)) {
            throw new MovimientoNoEncontradoException();
        }
    }
}
