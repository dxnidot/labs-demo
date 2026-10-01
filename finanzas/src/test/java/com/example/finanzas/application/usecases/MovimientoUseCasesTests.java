package com.example.finanzas.application.usecases;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.finanzas.application.ports.MovimientoRepository;
import com.example.finanzas.application.ports.TarjetaRepository;
import com.example.finanzas.domain.movimiento.Moneda;
import com.example.finanzas.domain.movimiento.Movimiento;
import com.example.finanzas.domain.movimiento.OrigenMovimiento;
import com.example.finanzas.domain.movimiento.ResumenCategoria;
import com.example.finanzas.domain.movimiento.TipoMovimiento;
import com.example.finanzas.domain.tarjeta.Tarjeta;
import com.example.finanzas.domain.tarjeta.TarjetaNoEncontradaException;

/**
 * Verifica CRUD, propiedad autenticada, pertenencia de tarjeta y resumen mensual.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@ExtendWith(MockitoExtension.class)
class MovimientoUseCasesTests {

    @Mock
    private MovimientoRepository movimientoRepository;

    @Mock
    private TarjetaRepository tarjetaRepository;

    private CrearMovimiento crearMovimiento;
    private ActualizarMovimiento actualizarMovimiento;
    private ObtenerMovimiento obtenerMovimiento;
    private ListarMovimientos listarMovimientos;
    private EliminarMovimiento eliminarMovimiento;
    private ConsultarResumenMensual consultarResumenMensual;

    @BeforeEach
    void setUp() {
        crearMovimiento = new CrearMovimiento(movimientoRepository, tarjetaRepository);
        actualizarMovimiento = new ActualizarMovimiento(movimientoRepository, tarjetaRepository);
        obtenerMovimiento = new ObtenerMovimiento(movimientoRepository);
        listarMovimientos = new ListarMovimientos(movimientoRepository);
        eliminarMovimiento = new EliminarMovimiento(movimientoRepository);
        consultarResumenMensual = new ConsultarResumenMensual(movimientoRepository);
    }

    @Test
    @DisplayName("Crea un movimiento con el sujeto autenticado y tarjeta opcional validada")
    void createsMovementForAuthenticatedSubject() {
        // Arrange
        UUID tarjetaId = UUID.randomUUID();
        when(tarjetaRepository.buscarPorIdYPropietario(tarjetaId, "usuario-prueba"))
                .thenReturn(Optional.of(new Tarjeta(
                        tarjetaId, "usuario-prueba", "Tarjeta demo", "1234", 10, 20, false, true)));
        when(movimientoRepository.crear(any(Movimiento.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        // Act
        Movimiento creado = crearMovimiento.ejecutar(
                "usuario-prueba",
                LocalDate.of(2026, 9, 2),
                new BigDecimal("15.20"),
                Moneda.MXN,
                "Comercio demo",
                "Comida",
                tarjetaId,
                OrigenMovimiento.MANUAL,
                TipoMovimiento.GASTO);

        // Assert
        ArgumentCaptor<Movimiento> captor = ArgumentCaptor.forClass(Movimiento.class);
        verify(movimientoRepository).crear(captor.capture());
        assertEquals("usuario-prueba", captor.getValue().ownerSub());
        assertEquals(tarjetaId, captor.getValue().tarjetaId());
        assertEquals(creado, captor.getValue());
    }

    @Test
    @DisplayName("Rechaza actualizar si la tarjeta opcional no pertenece al usuario")
    void rejectsUpdateWithCardOwnedByDifferentSubject() {
        // Arrange
        UUID id = UUID.randomUUID();
        UUID tarjetaAjena = UUID.randomUUID();
        when(tarjetaRepository.buscarPorIdYPropietario(tarjetaAjena, "usuario-prueba"))
                .thenReturn(Optional.empty());

        // Act y Assert
        assertThrows(TarjetaNoEncontradaException.class, () -> actualizarMovimiento.ejecutar(
                id,
                "usuario-prueba",
                LocalDate.of(2026, 9, 2),
                new BigDecimal("4.00"),
                Moneda.USD,
                "Comercio demo",
                "Transporte",
                tarjetaAjena,
                OrigenMovimiento.IMPORT,
                TipoMovimiento.GASTO));
        verify(movimientoRepository, never()).actualizarPorIdYPropietario(any(Movimiento.class));
    }

    @Test
    @DisplayName("Calcula totales mensuales separados por categoría, tipo y moneda")
    void summarizesByCategoryTypeAndCurrencyWithoutMixingCurrencies() {
        // Arrange
        List<Movimiento> movimientos = List.of(
                movimiento("10.00", Moneda.MXN, TipoMovimiento.GASTO, "Comida"),
                movimiento("5.25", Moneda.MXN, TipoMovimiento.GASTO, "Comida"),
                movimiento("3.00", Moneda.USD, TipoMovimiento.GASTO, "Comida"),
                movimiento("7.00", Moneda.MXN, TipoMovimiento.INGRESO, "Comida"));
        when(movimientoRepository.listarPorPropietarioYPeriodo(
                "usuario-prueba", LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)))
                .thenReturn(movimientos);

        // Act
        List<ResumenCategoria> resultado =
                consultarResumenMensual.ejecutar("usuario-prueba", YearMonth.of(2026, 9));

        // Assert
        assertEquals(3, resultado.size());
        assertEquals(new BigDecimal("15.25"), resultado.get(0).total());
        assertEquals(Moneda.MXN, resultado.get(0).moneda());
        assertEquals(TipoMovimiento.GASTO, resultado.get(0).tipo());
        assertEquals(new BigDecimal("3.00"), resultado.get(1).total());
        assertEquals(Moneda.USD, resultado.get(1).moneda());
        assertEquals(new BigDecimal("7.00"), resultado.get(2).total());
        assertEquals(TipoMovimiento.INGRESO, resultado.get(2).tipo());
    }

    @Test
    @DisplayName("Consulta, lista y elimina usando siempre el propietario autenticado")
    void scopesReadListAndDeleteToAuthenticatedOwner() {
        // Arrange
        UUID id = UUID.randomUUID();
        Movimiento movimiento = movimiento("2.00", Moneda.MXN, TipoMovimiento.GASTO, "Varios");
        when(movimientoRepository.buscarPorIdYPropietario(id, "usuario-prueba"))
                .thenReturn(Optional.of(movimiento));
        when(movimientoRepository.listarPorPropietario("usuario-prueba"))
                .thenReturn(List.of(movimiento));
        when(movimientoRepository.eliminarPorIdYPropietario(id, "usuario-prueba")).thenReturn(true);

        // Act
        Movimiento consultado = obtenerMovimiento.ejecutar(id, "usuario-prueba");
        List<Movimiento> lista = listarMovimientos.ejecutar("usuario-prueba");
        eliminarMovimiento.ejecutar(id, "usuario-prueba");

        // Assert
        assertEquals(movimiento, consultado);
        assertEquals(List.of(movimiento), lista);
        verify(movimientoRepository).buscarPorIdYPropietario(id, "usuario-prueba");
        verify(movimientoRepository).listarPorPropietario("usuario-prueba");
        verify(movimientoRepository).eliminarPorIdYPropietario(id, "usuario-prueba");
    }

    private Movimiento movimiento(String monto, Moneda moneda, TipoMovimiento tipo, String categoria) {
        return new Movimiento(
                UUID.randomUUID(),
                "usuario-prueba",
                LocalDate.of(2026, 9, 10),
                new BigDecimal(monto),
                moneda,
                "Comercio demo",
                categoria,
                null,
                OrigenMovimiento.MANUAL,
                tipo);
    }
}
