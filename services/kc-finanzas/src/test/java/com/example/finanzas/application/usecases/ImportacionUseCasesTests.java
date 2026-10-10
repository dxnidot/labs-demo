package com.example.finanzas.application.usecases;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.finanzas.application.importaciones.ImportacionPreview;
import com.example.finanzas.application.importaciones.MovimientoImportado;
import com.example.finanzas.application.ports.ImportacionPreviewStore;
import com.example.finanzas.application.ports.MovimientoRepository;
import com.example.finanzas.application.ports.TarjetaRepository;
import com.example.finanzas.domain.movimiento.Moneda;
import com.example.finanzas.domain.movimiento.Movimiento;
import com.example.finanzas.domain.movimiento.OrigenMovimiento;
import com.example.finanzas.domain.movimiento.TipoMovimiento;
import com.example.finanzas.domain.tarjeta.TarjetaNoEncontradaException;

/**
 * Verifica asociación al sujeto, origen forzado y validación de tarjeta al confirmar.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@ExtendWith(MockitoExtension.class)
class ImportacionUseCasesTests {

    @Mock
    private ImportacionPreviewStore previewStore;
    @Mock
    private MovimientoRepository movimientoRepository;
    @Mock
    private TarjetaRepository tarjetaRepository;

    @Test
    @DisplayName("Confirma el lote con el sujeto autenticado y fuerza origen IMPORT")
    void confirmsImportedMovementsAsAuthenticatedOwner() {
        // Arrange
        UUID importId = UUID.randomUUID();
        MovimientoImportado importado = movimiento(null);
        when(previewStore.consumir(importId, "sub-usuario"))
                .thenReturn(new ImportacionPreview(importId, List.of(importado)));

        // Act
        int total = new ConfirmarImportacion(previewStore, movimientoRepository, tarjetaRepository)
                .ejecutar(importId, "sub-usuario");

        // Assert
        ArgumentCaptor<List<Movimiento>> captor = ArgumentCaptor.forClass(List.class);
        verify(movimientoRepository).crearTodos(captor.capture());
        assertEquals(1, total);
        assertEquals(1, captor.getValue().size());
        assertEquals("sub-usuario", captor.getValue().get(0).ownerSub());
        assertEquals(OrigenMovimiento.IMPORT, captor.getValue().get(0).origen());
        assertEquals(TipoMovimiento.GASTO, captor.getValue().get(0).tipo());
    }

    @Test
    @DisplayName("Revalida la propiedad de cada tarjeta antes de persistir el lote")
    void rejectsUnownedCardBeforePersistingAnyMovement() {
        // Arrange
        UUID importId = UUID.randomUUID();
        UUID tarjetaId = UUID.randomUUID();
        when(previewStore.consumir(importId, "sub-usuario"))
                .thenReturn(new ImportacionPreview(importId, List.of(movimiento(tarjetaId))));
        when(tarjetaRepository.buscarPorIdYPropietario(tarjetaId, "sub-usuario")).thenReturn(Optional.empty());
        ConfirmarImportacion useCase =
                new ConfirmarImportacion(previewStore, movimientoRepository, tarjetaRepository);

        // Act / Assert
        assertThrows(TarjetaNoEncontradaException.class, () -> useCase.ejecutar(importId, "sub-usuario"));
        verify(movimientoRepository, never()).crearTodos(anyList());
    }

    @Test
    @DisplayName("Rechaza preview sin propietario antes de consumirlo")
    void rejectsMissingOwnerBeforeConsumingPreview() {
        // Arrange
        ConfirmarImportacion useCase =
                new ConfirmarImportacion(previewStore, movimientoRepository, tarjetaRepository);

        // Act / Assert
        assertThrows(IllegalArgumentException.class, () -> useCase.ejecutar(UUID.randomUUID(), " "));
        verify(previewStore, never()).consumir(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    private MovimientoImportado movimiento(UUID tarjetaId) {
        return new MovimientoImportado(
                LocalDate.of(2026, 9, 25),
                new BigDecimal("20.00"),
                Moneda.USD,
                "Comercio demo",
                "Transporte",
                tarjetaId,
                TipoMovimiento.GASTO);
    }
}
