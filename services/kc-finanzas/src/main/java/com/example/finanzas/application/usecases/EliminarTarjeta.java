package com.example.finanzas.application.usecases;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.example.finanzas.application.ports.TarjetaRepository;
import com.example.finanzas.domain.tarjeta.TarjetaNoEncontradaException;

/**
 * Elimina una tarjeta solo cuando pertenece al sujeto autenticado.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Service
public class EliminarTarjeta {

    private static final Logger logger = LoggerFactory.getLogger(EliminarTarjeta.class);

    private final TarjetaRepository tarjetaRepository;

    public EliminarTarjeta(TarjetaRepository tarjetaRepository) {
        this.tarjetaRepository = tarjetaRepository;
    }

    public void ejecutar(UUID id, String ownerSub) {
        if (!tarjetaRepository.eliminarPorIdYPropietario(id, ownerSub)) {
            throw new TarjetaNoEncontradaException();
        }
        logger.atInfo()
                .addKeyValue("tarjetaId", id)
                .log("Tarjeta eliminada");
    }
}
