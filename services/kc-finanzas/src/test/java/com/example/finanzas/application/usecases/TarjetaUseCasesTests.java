package com.example.finanzas.application.usecases;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.finanzas.application.ports.TarjetaRepository;
import com.example.finanzas.domain.tarjeta.Tarjeta;
import com.example.finanzas.domain.tarjeta.TarjetaNoEncontradaException;

/**
 * Verifica que los casos de uso limiten operaciones al sujeto autenticado.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@ExtendWith(MockitoExtension.class)
class TarjetaUseCasesTests {

    @Mock
    private TarjetaRepository tarjetaRepository;

    @InjectMocks
    private ObtenerTarjeta obtenerTarjeta;

    @InjectMocks
    private CrearTarjeta crearTarjeta;

    @InjectMocks
    private ListarTarjetas listarTarjetas;

    @InjectMocks
    private ActualizarTarjeta actualizarTarjeta;

    @InjectMocks
    private EliminarTarjeta eliminarTarjeta;

    @Test
    @DisplayName("Crea una tarjeta usando el sujeto autenticado como propietario")
    void createsCardForAuthenticatedOwner() {
        when(tarjetaRepository.crear(any(Tarjeta.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        Tarjeta resultado = crearTarjeta.ejecutar(
                "usuario-prueba",
                "Tarjeta prueba",
                "1234",
                15,
                20,
                false,
                true);

        ArgumentCaptor<Tarjeta> tarjetaCaptor = ArgumentCaptor.forClass(Tarjeta.class);
        verify(tarjetaRepository).crear(tarjetaCaptor.capture());
        assertEquals("usuario-prueba", tarjetaCaptor.getValue().ownerSub());
        assertEquals("usuario-prueba", resultado.ownerSub());
    }

    @Test
    @DisplayName("Lista tarjetas solo para el propietario autenticado")
    void listsCardsForAuthenticatedOwner() {
        Tarjeta tarjeta = tarjeta(UUID.randomUUID(), "usuario-prueba");
        when(tarjetaRepository.listarPorPropietario("usuario-prueba")).thenReturn(List.of(tarjeta));

        List<Tarjeta> resultado = listarTarjetas.ejecutar("usuario-prueba");

        assertEquals(List.of(tarjeta), resultado);
        verify(tarjetaRepository).listarPorPropietario("usuario-prueba");
    }

    @Test
    @DisplayName("Busca una tarjeta usando el propietario recibido del token")
    void looksUpCardByAuthenticatedOwner() {
        UUID id = UUID.randomUUID();
        Tarjeta tarjeta = tarjeta(id, "usuario-prueba");
        when(tarjetaRepository.buscarPorIdYPropietario(id, "usuario-prueba")).thenReturn(Optional.of(tarjeta));

        Tarjeta resultado = obtenerTarjeta.ejecutar(id, "usuario-prueba");

        assertEquals(tarjeta, resultado);
        verify(tarjetaRepository).buscarPorIdYPropietario(id, "usuario-prueba");
    }

    @Test
    @DisplayName("Rechaza una tarjeta que no pertenece al propietario autenticado")
    void rejectsCardOwnedByAnotherSubject() {
        UUID id = UUID.randomUUID();
        when(tarjetaRepository.buscarPorIdYPropietario(id, "otro-usuario")).thenReturn(Optional.empty());

        assertThrows(TarjetaNoEncontradaException.class, () -> obtenerTarjeta.ejecutar(id, "otro-usuario"));
        verify(tarjetaRepository).buscarPorIdYPropietario(id, "otro-usuario");
    }

    @Test
    @DisplayName("Actualiza solo una tarjeta del propietario autenticado")
    void updatesCardForAuthenticatedOwnerOnly() {
        UUID id = UUID.randomUUID();
        Tarjeta tarjeta = tarjeta(id, "usuario-prueba");
        when(tarjetaRepository.actualizarPorIdYPropietario(tarjeta)).thenReturn(Optional.of(tarjeta));

        Tarjeta resultado = actualizarTarjeta.ejecutar(id, "usuario-prueba", "Tarjeta prueba",
                "1234", 15, 20, false, true);

        assertEquals(tarjeta, resultado);
        verify(tarjetaRepository).actualizarPorIdYPropietario(tarjeta);
    }

    @Test
    @DisplayName("Rechaza la eliminación cuando no coincide el propietario")
    void rejectsDeleteForDifferentOwner() {
        UUID id = UUID.randomUUID();
        when(tarjetaRepository.eliminarPorIdYPropietario(id, "otro-usuario")).thenReturn(false);

        assertThrows(TarjetaNoEncontradaException.class,
                () -> eliminarTarjeta.ejecutar(id, "otro-usuario"));
        verify(tarjetaRepository).eliminarPorIdYPropietario(id, "otro-usuario");
    }

    private Tarjeta tarjeta(UUID id, String ownerSub) {
        return new Tarjeta(id, ownerSub, "Tarjeta prueba", "1234", 15, 20, false, true);
    }
}
