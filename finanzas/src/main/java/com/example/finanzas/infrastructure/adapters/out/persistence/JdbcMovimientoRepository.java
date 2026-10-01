package com.example.finanzas.infrastructure.adapters.out.persistence;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.example.finanzas.application.ports.MovimientoRepository;
import com.example.finanzas.domain.movimiento.Movimiento;

/**
 * Persiste movimientos con todas las lecturas y escrituras limitadas al propietario.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Repository
public class JdbcMovimientoRepository implements MovimientoRepository {

    private static final String SELECT_COLUMNS = """
            SELECT id, owner_sub, fecha, monto, moneda, comercio, categoria, card_id, origen, tipo
            FROM movimientos
            """;

    private final JdbcTemplate jdbcTemplate;

    public JdbcMovimientoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Movimiento crear(Movimiento movimiento) {
        jdbcTemplate.update("""
                INSERT INTO movimientos (
                    id, owner_sub, fecha, monto, moneda, comercio, categoria, card_id, origen, tipo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                movimiento.id(),
                movimiento.ownerSub(),
                movimiento.fecha(),
                movimiento.monto(),
                movimiento.moneda().name(),
                movimiento.comercio(),
                movimiento.categoria(),
                movimiento.tarjetaId(),
                movimiento.origen().name(),
                movimiento.tipo().name());
        return movimiento;
    }

    @Override
    public List<Movimiento> listarPorPropietario(String ownerSub) {
        return jdbcTemplate.query(SELECT_COLUMNS + " WHERE owner_sub = ? ORDER BY fecha DESC, id",
                MovimientoRowMapper.INSTANCE, ownerSub);
    }

    @Override
    public List<Movimiento> listarPorPropietarioYPeriodo(String ownerSub, LocalDate desde, LocalDate hasta) {
        return jdbcTemplate.query(SELECT_COLUMNS
                        + " WHERE owner_sub = ? AND fecha BETWEEN ? AND ? ORDER BY fecha, id",
                MovimientoRowMapper.INSTANCE, ownerSub, desde, hasta);
    }

    @Override
    public Optional<Movimiento> buscarPorIdYPropietario(UUID id, String ownerSub) {
        return jdbcTemplate.query(SELECT_COLUMNS + " WHERE id = ? AND owner_sub = ?",
                MovimientoRowMapper.INSTANCE, id, ownerSub).stream().findFirst();
    }

    @Override
    public Optional<Movimiento> actualizarPorIdYPropietario(Movimiento movimiento) {
        int actualizadas = jdbcTemplate.update("""
                UPDATE movimientos
                SET fecha = ?, monto = ?, moneda = ?, comercio = ?, categoria = ?, card_id = ?, origen = ?, tipo = ?
                WHERE id = ? AND owner_sub = ?
                """,
                movimiento.fecha(),
                movimiento.monto(),
                movimiento.moneda().name(),
                movimiento.comercio(),
                movimiento.categoria(),
                movimiento.tarjetaId(),
                movimiento.origen().name(),
                movimiento.tipo().name(),
                movimiento.id(),
                movimiento.ownerSub());
        return actualizadas == 0 ? Optional.empty() : Optional.of(movimiento);
    }

    @Override
    public boolean eliminarPorIdYPropietario(UUID id, String ownerSub) {
        return jdbcTemplate.update("DELETE FROM movimientos WHERE id = ? AND owner_sub = ?", id, ownerSub) > 0;
    }
}
