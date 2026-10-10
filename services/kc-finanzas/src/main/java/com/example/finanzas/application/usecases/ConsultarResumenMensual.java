package com.example.finanzas.application.usecases;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.stereotype.Service;

import com.example.finanzas.application.ports.MovimientoRepository;
import com.example.finanzas.domain.movimiento.Moneda;
import com.example.finanzas.domain.movimiento.Movimiento;
import com.example.finanzas.domain.movimiento.ResumenCategoria;
import com.example.finanzas.domain.movimiento.TipoMovimiento;

/**
 * Calcula totales mensuales por categoría, tipo y moneda sin combinar monedas.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Service
public class ConsultarResumenMensual {

    private final MovimientoRepository movimientoRepository;

    public ConsultarResumenMensual(MovimientoRepository movimientoRepository) {
        this.movimientoRepository = movimientoRepository;
    }

    public List<ResumenCategoria> ejecutar(String ownerSub, YearMonth periodo) {
        if (periodo == null) {
            throw new IllegalArgumentException("El periodo es obligatorio");
        }
        List<Movimiento> movimientos = movimientoRepository.listarPorPropietarioYPeriodo(
                ownerSub, periodo.atDay(1), periodo.atEndOfMonth());
        Map<ClaveResumen, BigDecimal> totales = new TreeMap<>(Comparator
                .comparing((ClaveResumen clave) -> clave.categoria)
                .thenComparing(clave -> clave.tipo.name())
                .thenComparing(clave -> clave.moneda.name()));
        for (Movimiento movimiento : movimientos) {
            ClaveResumen clave = new ClaveResumen(
                    movimiento.categoria(), movimiento.tipo(), movimiento.moneda());
            totales.merge(clave, movimiento.monto(), BigDecimal::add);
        }
        return totales.entrySet().stream()
                .map(entrada -> new ResumenCategoria(
                        entrada.getKey().categoria,
                        entrada.getKey().tipo,
                        entrada.getKey().moneda,
                        entrada.getValue()))
                .toList();
    }

    private record ClaveResumen(String categoria, TipoMovimiento tipo, Moneda moneda) {
    }
}
