package com.example.finanzas.application.ports;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.example.finanzas.domain.tarjeta.Tarjeta;

/**
 * Define las operaciones de persistencia limitadas al propietario.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public interface TarjetaRepository {

    Tarjeta crear(Tarjeta tarjeta);

    List<Tarjeta> listarPorPropietario(String ownerSub);

    List<Tarjeta> listarActivasPorPropietario(String ownerSub);

    Optional<Tarjeta> buscarPorIdYPropietario(UUID id, String ownerSub);

    Optional<Tarjeta> actualizarPorIdYPropietario(Tarjeta tarjeta);

    boolean eliminarPorIdYPropietario(UUID id, String ownerSub);
}
