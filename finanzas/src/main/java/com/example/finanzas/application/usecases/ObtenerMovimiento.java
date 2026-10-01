package com.example.finanzas.application.usecases;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.finanzas.application.ports.MovimientoRepository;
import com.example.finanzas.domain.movimiento.Movimiento;
import com.example.finanzas.domain.movimiento.MovimientoNoEncontradoException;

/**
 * Busca un movimiento que pertenezca al sujeto autenticado.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Service
public class ObtenerMovimiento {

    private final MovimientoRepository movimientoRepository;

    public ObtenerMovimiento(MovimientoRepository movimientoRepository) {
        this.movimientoRepository = movimientoRepository;
    }

    public Movimiento ejecutar(UUID id, String ownerSub) {
        return movimientoRepository.buscarPorIdYPropietario(id, ownerSub)
                .orElseThrow(MovimientoNoEncontradoException::new);
    }
}
