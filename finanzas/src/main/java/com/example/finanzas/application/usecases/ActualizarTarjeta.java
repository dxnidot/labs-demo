package com.example.finanzas.application.usecases;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.example.finanzas.application.ports.TarjetaRepository;
import com.example.finanzas.domain.tarjeta.Tarjeta;
import com.example.finanzas.domain.tarjeta.TarjetaNoEncontradaException;

/**
 * Actualiza una tarjeta solo cuando pertenece al sujeto autenticado.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Service
public class ActualizarTarjeta {

    private static final Logger logger = LoggerFactory.getLogger(ActualizarTarjeta.class);

    private final TarjetaRepository tarjetaRepository;

    public ActualizarTarjeta(TarjetaRepository tarjetaRepository) {
        this.tarjetaRepository = tarjetaRepository;
    }

    public Tarjeta ejecutar(
            UUID id,
            String ownerSub,
            String alias,
            String ultimos4,
            int diaCorte,
            int diaPago,
            boolean permiteLiquidarMsiAnticipado,
            boolean activa) {
        Tarjeta tarjeta = new Tarjeta(
                id,
                ownerSub,
                alias,
                ultimos4,
                diaCorte,
                diaPago,
                permiteLiquidarMsiAnticipado,
                activa);
        Tarjeta actualizada = tarjetaRepository.actualizarPorIdYPropietario(tarjeta)
                .orElseThrow(() -> {
                    return new TarjetaNoEncontradaException();
                });
        logger.atInfo()
                .addKeyValue("tarjetaId", actualizada.id())
                .log("Tarjeta actualizada");
        return actualizada;
    }
}
