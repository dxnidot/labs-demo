package com.example.finanzas.domain.tarjeta;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Calcula eventos de corte y pago sin aplicar ajustes por días inhábiles.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public class CalculadoraCalendario {

    public List<EventoCalendario> calcular(List<Tarjeta> tarjetas, LocalDate desde, int dias) {
        if (desde == null) {
            throw new IllegalArgumentException("La fecha inicial es obligatoria");
        }
        if (dias < 1 || dias > 3660) {
            throw new IllegalArgumentException("El número de días debe estar entre 1 y 3660");
        }

        LocalDate hasta = desde.plusDays(dias - 1L);
        YearMonth mes = YearMonth.from(desde.minusMonths(1));
        YearMonth ultimoMes = YearMonth.from(hasta);
        List<EventoCalendario> eventos = new ArrayList<>();

        while (!mes.isAfter(ultimoMes)) {
            for (Tarjeta tarjeta : tarjetas) {
                if (!tarjeta.activa()) {
                    continue;
                }
                agregarSiEnRango(eventos, fechaDelMes(mes, tarjeta.diaCorte()), TipoEvento.CORTE, tarjeta.alias(),
                        desde, hasta);
                agregarSiEnRango(eventos, fechaDelMes(mes.plusMonths(1), tarjeta.diaPago()), TipoEvento.PAGO,
                        tarjeta.alias(), desde, hasta);
            }
            mes = mes.plusMonths(1);
        }

        return eventos.stream()
                .sorted(Comparator.comparing(EventoCalendario::fecha)
                        .thenComparing(EventoCalendario::tipo)
                        .thenComparing(EventoCalendario::alias))
                .toList();
    }

    private LocalDate fechaDelMes(YearMonth mes, int dia) {
        return mes.atDay(Math.min(dia, mes.lengthOfMonth()));
    }

    private void agregarSiEnRango(
            List<EventoCalendario> eventos,
            LocalDate fecha,
            TipoEvento tipo,
            String alias,
            LocalDate desde,
            LocalDate hasta) {
        if (!fecha.isBefore(desde) && !fecha.isAfter(hasta)) {
            eventos.add(new EventoCalendario(fecha, tipo, alias));
        }
    }
}
