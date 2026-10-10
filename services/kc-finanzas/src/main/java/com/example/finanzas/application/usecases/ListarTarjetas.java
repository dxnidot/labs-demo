package com.example.finanzas.application.usecases;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.example.finanzas.application.ports.TarjetaRepository;
import com.example.finanzas.domain.tarjeta.Tarjeta;

/**
 * Lista exclusivamente las tarjetas del sujeto autenticado.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Service
public class ListarTarjetas {

    private static final Logger logger = LoggerFactory.getLogger(ListarTarjetas.class);

    private final TarjetaRepository tarjetaRepository;

    public ListarTarjetas(TarjetaRepository tarjetaRepository) {
        this.tarjetaRepository = tarjetaRepository;
    }

    public List<Tarjeta> ejecutar(String ownerSub) {
        List<Tarjeta> tarjetas = tarjetaRepository.listarPorPropietario(ownerSub);
        logger.atInfo()
                .addKeyValue("total", tarjetas.size())
                .log("Tarjetas consultadas");
        return tarjetas;
    }
}
