package com.example.finanzas.infrastructure.adapters.out.memory;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import com.example.finanzas.application.importaciones.ImportacionNoEncontradaException;
import com.example.finanzas.application.importaciones.ImportacionPreview;
import com.example.finanzas.application.importaciones.ImportacionPropiedadException;
import com.example.finanzas.application.importaciones.MovimientoImportado;
import com.example.finanzas.application.ports.ImportacionPreviewStore;

/**
 * Guarda previews exclusivamente en memoria, con vencimiento y consumo de un solo uso.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Component
public class InMemoryImportacionPreviewStore implements ImportacionPreviewStore {

    private static final Duration TTL = Duration.ofMinutes(15);

    private final ConcurrentHashMap<UUID, EntradaPreview> previews = new ConcurrentHashMap<>();
    private final Clock clock;

    public InMemoryImportacionPreviewStore() {
        this(Clock.systemUTC());
    }

    InMemoryImportacionPreviewStore(Clock clock) {
        this.clock = clock;
    }

    @Override
    public UUID guardar(String ownerSub, List<MovimientoImportado> movimientos) {
        Instant ahora = clock.instant();
        previews.entrySet().removeIf(entry -> !entry.getValue().expiraEn().isAfter(ahora));
        UUID importId = UUID.randomUUID();
        previews.put(importId, new EntradaPreview(
                ownerSub, List.copyOf(movimientos), ahora.plus(TTL)));
        return importId;
    }

    @Override
    public synchronized ImportacionPreview consumir(UUID importId, String ownerSub) {
        EntradaPreview entrada = previews.get(importId);
        if (entrada == null) {
            throw new ImportacionNoEncontradaException();
        }
        if (!entrada.expiraEn().isAfter(clock.instant())) {
            previews.remove(importId);
            throw new ImportacionNoEncontradaException();
        }
        if (!entrada.ownerSub().equals(ownerSub)) {
            throw new ImportacionPropiedadException();
        }
        previews.remove(importId);
        return new ImportacionPreview(importId, entrada.movimientos());
    }

    private record EntradaPreview(
            String ownerSub,
            List<MovimientoImportado> movimientos,
            Instant expiraEn) {
    }
}
