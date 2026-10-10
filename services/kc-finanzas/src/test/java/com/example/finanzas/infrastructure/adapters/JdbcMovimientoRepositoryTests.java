package com.example.finanzas.infrastructure.adapters;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import com.example.finanzas.domain.movimiento.Moneda;
import com.example.finanzas.domain.movimiento.Movimiento;
import com.example.finanzas.domain.movimiento.OrigenMovimiento;
import com.example.finanzas.domain.movimiento.TipoMovimiento;
import com.example.finanzas.infrastructure.adapters.out.persistence.JdbcMovimientoRepository;

/**
 * Comprueba que el adaptador JDBC aplique aislamiento por propietario.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@ExtendWith(MockitoExtension.class)
class JdbcMovimientoRepositoryTests {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Actualiza únicamente el movimiento y propietario indicados")
    void updateIncludesIdAndOwnerInSqlPredicate() {
        // Arrange
        UUID id = UUID.randomUUID();
        Movimiento movimiento = new Movimiento(
                id,
                "usuario-prueba",
                LocalDate.of(2026, 9, 10),
                new BigDecimal("12.50"),
                Moneda.MXN,
                "Comercio demo",
                "Varios",
                null,
                OrigenMovimiento.MANUAL,
                TipoMovimiento.GASTO);
        when(jdbcTemplate.update(any(String.class), any(Object[].class))).thenReturn(1);
        JdbcMovimientoRepository repository = new JdbcMovimientoRepository(jdbcTemplate);

        // Act
        repository.actualizarPorIdYPropietario(movimiento);

        // Assert
        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate).update(sqlCaptor.capture(), any(Object[].class));
        assertTrue(sqlCaptor.getValue().contains("WHERE id = ? AND owner_sub = ?"));
    }

    @Test
    @DisplayName("Elimina únicamente con identificador y propietario autenticado")
    void deleteIncludesIdAndOwnerInSqlPredicate() {
        // Arrange
        UUID id = UUID.randomUUID();
        when(jdbcTemplate.update(
                contains("DELETE FROM movimientos WHERE id = ? AND owner_sub = ?"), eq(id), eq("usuario-prueba"))
                ).thenReturn(1);
        JdbcMovimientoRepository repository = new JdbcMovimientoRepository(jdbcTemplate);

        // Act
        boolean eliminado = repository.eliminarPorIdYPropietario(id, "usuario-prueba");

        // Assert
        assertTrue(eliminado);
        verify(jdbcTemplate).update(
                contains("DELETE FROM movimientos WHERE id = ? AND owner_sub = ?"), eq(id), eq("usuario-prueba"));
    }
}
