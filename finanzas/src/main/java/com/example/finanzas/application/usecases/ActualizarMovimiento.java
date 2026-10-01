package com.example.finanzas.application.usecases;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.finanzas.application.ports.MovimientoRepository;
import com.example.finanzas.application.ports.TarjetaRepository;
import com.example.finanzas.domain.movimiento.Moneda;
import com.example.finanzas.domain.movimiento.Movimiento;
import com.example.finanzas.domain.movimiento.MovimientoNoEncontradoException;
import com.example.finanzas.domain.movimiento.OrigenMovimiento;
import com.example.finanzas.domain.movimiento.TipoMovimiento;
import com.example.finanzas.domain.tarjeta.TarjetaNoEncontradaException;

/**
 * Reemplaza un movimiento solo si pertenece al sujeto autenticado.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Service
public class ActualizarMovimiento {

    private final MovimientoRepository movimientoRepository;
    private final TarjetaRepository tarjetaRepository;

    public ActualizarMovimiento(MovimientoRepository movimientoRepository, TarjetaRepository tarjetaRepository) {
        this.movimientoRepository = movimientoRepository;
        this.tarjetaRepository = tarjetaRepository;
    }

    public Movimiento ejecutar(
            UUID id,
            String ownerSub,
            LocalDate fecha,
            BigDecimal monto,
            Moneda moneda,
            String comercio,
            String categoria,
            UUID tarjetaId,
            OrigenMovimiento origen,
            TipoMovimiento tipo) {
        validarTarjeta(ownerSub, tarjetaId);
        Movimiento movimiento = new Movimiento(
                id, ownerSub, fecha, monto, moneda, comercio, categoria, tarjetaId, origen, tipo);
        return movimientoRepository.actualizarPorIdYPropietario(movimiento)
                .orElseThrow(MovimientoNoEncontradoException::new);
    }

    private void validarTarjeta(String ownerSub, UUID tarjetaId) {
        if (tarjetaId != null && tarjetaRepository.buscarPorIdYPropietario(tarjetaId, ownerSub).isEmpty()) {
            throw new TarjetaNoEncontradaException();
        }
    }
}
