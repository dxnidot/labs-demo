package com.example.finanzas.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.finanzas.application.ports.MovimientoRepository;
import com.example.finanzas.domain.movimiento.Movimiento;

/**
 * Lista los movimientos del sujeto autenticado dentro de un periodo.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Service
public class ListarMovimientos {

    private final MovimientoRepository movimientoRepository;

    public ListarMovimientos(MovimientoRepository movimientoRepository) {
        this.movimientoRepository = movimientoRepository;
    }

    public List<Movimiento> ejecutar(String ownerSub) {
        return movimientoRepository.listarPorPropietario(ownerSub);
    }
}
