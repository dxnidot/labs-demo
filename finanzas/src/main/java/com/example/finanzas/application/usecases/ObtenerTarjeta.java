package com.example.finanzas.application.usecases;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.finanzas.application.ports.TarjetaRepository;
import com.example.finanzas.domain.tarjeta.Tarjeta;
import com.example.finanzas.domain.tarjeta.TarjetaNoEncontradaException;

/**
 * Busca una tarjeta que pertenezca al sujeto autenticado.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Service
public class ObtenerTarjeta {

    private final TarjetaRepository tarjetaRepository;

    public ObtenerTarjeta(TarjetaRepository tarjetaRepository) {
        this.tarjetaRepository = tarjetaRepository;
    }

    public Tarjeta ejecutar(UUID id, String ownerSub) {
        return tarjetaRepository.buscarPorIdYPropietario(id, ownerSub)
                .orElseThrow(TarjetaNoEncontradaException::new);
    }
}
