package com.example.finanzas.infrastructure.adapters.out.persistence;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

import org.springframework.jdbc.core.RowMapper;

import com.example.finanzas.domain.tarjeta.Tarjeta;

/**
 * Convierte filas de PostgreSQL al modelo de dominio de tarjeta.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
public class TarjetaRowMapper implements RowMapper<Tarjeta> {

    public static final TarjetaRowMapper INSTANCE = new TarjetaRowMapper();

    private TarjetaRowMapper() {
    }

    @Override
    public Tarjeta mapRow(ResultSet resultSet, int rowNumber) throws SQLException {
        return new Tarjeta(
                resultSet.getObject("id", UUID.class),
                resultSet.getString("owner_sub"),
                resultSet.getString("alias"),
                resultSet.getString("ultimos4").trim(),
                resultSet.getInt("dia_corte"),
                resultSet.getInt("dia_pago"),
                resultSet.getBoolean("permite_liquidar_msi_anticipado"),
                resultSet.getBoolean("activa"));
    }
}
