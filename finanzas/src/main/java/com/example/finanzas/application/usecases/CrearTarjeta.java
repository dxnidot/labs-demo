package com.example.finanzas.application.usecases;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.example.finanzas.application.ports.TarjetaRepository;
import com.example.finanzas.domain.tarjeta.Tarjeta;

/**
 * Crea una tarjeta asignándola al sujeto autenticado.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Service
public class CrearTarjeta {

    private static final Logger logger = LoggerFactory.getLogger(CrearTarjeta.class);

    private final TarjetaRepository tarjetaRepository;

    public CrearTarjeta(TarjetaRepository tarjetaRepository) {
        this.tarjetaRepository = tarjetaRepository;
    }

    public Tarjeta ejecutar(
            String ownerSub,
            String alias,
            String ultimos4,
            int diaCorte,
            int diaPago,
            boolean permiteLiquidarMsiAnticipado,
            boolean activa) {
        Tarjeta tarjeta = new Tarjeta(
                UUID.randomUUID(),
                ownerSub,
                alias,
                ultimos4,
                diaCorte,
                diaPago,
                permiteLiquidarMsiAnticipado,
                activa);
        Tarjeta creada = tarjetaRepository.crear(tarjeta);
        logger.atInfo()
                .addKeyValue("tarjetaId", creada.id())
                .log("Tarjeta creada");
        return creada;
    }
}
