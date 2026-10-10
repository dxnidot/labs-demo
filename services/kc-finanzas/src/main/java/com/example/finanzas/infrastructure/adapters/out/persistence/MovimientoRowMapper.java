package com.example.finanzas.infrastructure.adapters.out.persistence;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

import org.springframework.jdbc.core.RowMapper;

import com.example.finanzas.domain.movimiento.Moneda;
import com.example.finanzas.domain.movimiento.Movimiento;
import com.example.finanzas.domain.movimiento.OrigenMovimiento;
import com.example.finanzas.domain.movimiento.TipoMovimiento;

/**
 * Convierte filas de PostgreSQL al modelo de dominio de movimiento.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public class MovimientoRowMapper implements RowMapper<Movimiento> {

    public static final MovimientoRowMapper INSTANCE = new MovimientoRowMapper();

    private MovimientoRowMapper() {
    }

    @Override
    public Movimiento mapRow(ResultSet resultSet, int rowNumber) throws SQLException {
        return new Movimiento(
                resultSet.getObject("id", UUID.class),
                resultSet.getString("owner_sub"),
                resultSet.getDate("fecha").toLocalDate(),
                resultSet.getBigDecimal("monto"),
                Moneda.valueOf(resultSet.getString("moneda")),
                resultSet.getString("comercio"),
                resultSet.getString("categoria"),
                resultSet.getObject("card_id", UUID.class),
                OrigenMovimiento.valueOf(resultSet.getString("origen")),
                TipoMovimiento.valueOf(resultSet.getString("tipo")));
    }
}
