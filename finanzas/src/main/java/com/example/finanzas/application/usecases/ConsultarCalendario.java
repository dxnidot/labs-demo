package com.example.finanzas.application.usecases;

import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.example.finanzas.application.ports.TarjetaRepository;
import com.example.finanzas.domain.tarjeta.CalculadoraCalendario;
import com.example.finanzas.domain.tarjeta.EventoCalendario;

/**
 * Consulta eventos calculados para las tarjetas activas del sujeto autenticado.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Service
public class ConsultarCalendario {

    private static final Logger logger = LoggerFactory.getLogger(ConsultarCalendario.class);

    private final TarjetaRepository tarjetaRepository;
    private final CalculadoraCalendario calculadoraCalendario;

    public ConsultarCalendario(TarjetaRepository tarjetaRepository) {
        this.tarjetaRepository = tarjetaRepository;
        this.calculadoraCalendario = new CalculadoraCalendario();
    }

    public List<EventoCalendario> ejecutar(String ownerSub, LocalDate desde, int dias) {
        List<EventoCalendario> eventos = calculadoraCalendario.calcular(
                tarjetaRepository.listarActivasPorPropietario(ownerSub),
                desde,
                dias);
        logger.atInfo()
                .addKeyValue("total", eventos.size())
                .log("Eventos de calendario consultados");
        return eventos;
    }
}
