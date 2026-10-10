package com.example.finanzas.application.ports;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.example.finanzas.domain.movimiento.Movimiento;

/**
 * Define operaciones de persistencia de movimientos acotadas por propietario.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified 2026-09-30
 */
public interface MovimientoRepository {

    Movimiento crear(Movimiento movimiento);

    void crearTodos(List<Movimiento> movimientos);

    List<Movimiento> listarPorPropietario(String ownerSub);

    List<Movimiento> listarPorPropietarioYPeriodo(String ownerSub, LocalDate desde, LocalDate hasta);

    Optional<Movimiento> buscarPorIdYPropietario(UUID id, String ownerSub);

    Optional<Movimiento> actualizarPorIdYPropietario(Movimiento movimiento);

    boolean eliminarPorIdYPropietario(UUID id, String ownerSub);
}
