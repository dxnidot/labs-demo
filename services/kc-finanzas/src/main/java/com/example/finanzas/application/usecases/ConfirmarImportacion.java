package com.example.finanzas.application.usecases;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.finanzas.application.importaciones.ImportacionPreview;
import com.example.finanzas.application.importaciones.MovimientoImportado;
import com.example.finanzas.application.ports.ImportacionPreviewStore;
import com.example.finanzas.application.ports.MovimientoRepository;
import com.example.finanzas.application.ports.TarjetaRepository;
import com.example.finanzas.domain.movimiento.Movimiento;
import com.example.finanzas.domain.movimiento.OrigenMovimiento;
import com.example.finanzas.domain.tarjeta.TarjetaNoEncontradaException;

/**
 * Consume un preview propio, revalida tarjetas y persiste el lote en una transacción.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Service
public class ConfirmarImportacion {

    private final ImportacionPreviewStore previewStore;
    private final MovimientoRepository movimientoRepository;
    private final TarjetaRepository tarjetaRepository;

    public ConfirmarImportacion(
            ImportacionPreviewStore previewStore,
            MovimientoRepository movimientoRepository,
            TarjetaRepository tarjetaRepository) {
        this.previewStore = previewStore;
        this.movimientoRepository = movimientoRepository;
        this.tarjetaRepository = tarjetaRepository;
    }

    @Transactional
    public int ejecutar(UUID importId, String ownerSub) {
        if (ownerSub == null || ownerSub.isBlank()) {
            throw new IllegalArgumentException("Propietario inválido");
        }

        ImportacionPreview preview = previewStore.consumir(importId, ownerSub);
        List<Movimiento> movimientos = preview.movimientos().stream()
                .map(movimiento -> movimientoPersistido(ownerSub, movimiento))
                .toList();
        movimientoRepository.crearTodos(movimientos);
        return movimientos.size();
    }

    private Movimiento movimientoPersistido(String ownerSub, MovimientoImportado importado) {
        if (importado.tarjetaId() != null
                && tarjetaRepository.buscarPorIdYPropietario(importado.tarjetaId(), ownerSub).isEmpty()) {
            throw new TarjetaNoEncontradaException();
        }
        return new Movimiento(
                UUID.randomUUID(),
                ownerSub,
                importado.fecha(),
                importado.monto(),
                importado.moneda(),
                importado.comercio(),
                importado.categoria(),
                importado.tarjetaId(),
                OrigenMovimiento.IMPORT,
                importado.tipo());
    }
}
