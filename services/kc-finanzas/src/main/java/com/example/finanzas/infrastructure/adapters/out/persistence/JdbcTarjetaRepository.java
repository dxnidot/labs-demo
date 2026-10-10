package com.example.finanzas.infrastructure.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.example.finanzas.application.ports.TarjetaRepository;
import com.example.finanzas.domain.tarjeta.Tarjeta;

/**
 * Persiste tarjetas en PostgreSQL con consultas acotadas por propietario.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Repository
public class JdbcTarjetaRepository implements TarjetaRepository {

    private static final String SELECT_COLUMNS = """
            SELECT id, owner_sub, alias, ultimos4, dia_corte, dia_pago,
                   permite_liquidar_msi_anticipado, activa
            FROM tarjetas
            """;

    private final JdbcTemplate jdbcTemplate;

    public JdbcTarjetaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Tarjeta crear(Tarjeta tarjeta) {
        jdbcTemplate.update("""
                INSERT INTO tarjetas (
                    id, owner_sub, alias, ultimos4, dia_corte, dia_pago,
                    permite_liquidar_msi_anticipado, activa
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                tarjeta.id(),
                tarjeta.ownerSub(),
                tarjeta.alias(),
                tarjeta.ultimos4(),
                tarjeta.diaCorte(),
                tarjeta.diaPago(),
                tarjeta.permiteLiquidarMsiAnticipado(),
                tarjeta.activa());
        return tarjeta;
    }

    @Override
    public List<Tarjeta> listarPorPropietario(String ownerSub) {
        return jdbcTemplate.query(SELECT_COLUMNS + " WHERE owner_sub = ? ORDER BY alias, id",
                TarjetaRowMapper.INSTANCE, ownerSub);
    }

    @Override
    public List<Tarjeta> listarActivasPorPropietario(String ownerSub) {
        return jdbcTemplate.query(SELECT_COLUMNS + " WHERE owner_sub = ? AND activa = TRUE ORDER BY alias, id",
                TarjetaRowMapper.INSTANCE, ownerSub);
    }

    @Override
    public Optional<Tarjeta> buscarPorIdYPropietario(UUID id, String ownerSub) {
        return jdbcTemplate.query(SELECT_COLUMNS + " WHERE id = ? AND owner_sub = ?",
                TarjetaRowMapper.INSTANCE, id, ownerSub).stream().findFirst();
    }

    @Override
    public Optional<Tarjeta> actualizarPorIdYPropietario(Tarjeta tarjeta) {
        int actualizadas = jdbcTemplate.update("""
                UPDATE tarjetas
                SET alias = ?, ultimos4 = ?, dia_corte = ?, dia_pago = ?,
                    permite_liquidar_msi_anticipado = ?, activa = ?
                WHERE id = ? AND owner_sub = ?
                """,
                tarjeta.alias(),
                tarjeta.ultimos4(),
                tarjeta.diaCorte(),
                tarjeta.diaPago(),
                tarjeta.permiteLiquidarMsiAnticipado(),
                tarjeta.activa(),
                tarjeta.id(),
                tarjeta.ownerSub());
        return actualizadas == 0 ? Optional.empty() : Optional.of(tarjeta);
    }

    @Override
    public boolean eliminarPorIdYPropietario(UUID id, String ownerSub) {
        return jdbcTemplate.update("DELETE FROM tarjetas WHERE id = ? AND owner_sub = ?", id, ownerSub) > 0;
    }
}
