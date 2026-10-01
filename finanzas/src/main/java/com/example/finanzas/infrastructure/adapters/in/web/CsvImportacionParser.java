package com.example.finanzas.infrastructure.adapters.in.web;

import java.io.IOException;
import java.io.StringReader;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.UUID;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Component;

import com.example.finanzas.application.importaciones.MovimientoImportado;
import com.example.finanzas.domain.movimiento.Moneda;
import com.example.finanzas.domain.movimiento.TipoMovimiento;

/**
 * Interpreta CSV RFC 4180 limitado, valida estrictamente sus siete columnas y no expone datos de fila.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Component
public class CsvImportacionParser {

    public static final int MAX_FILE_BYTES = 1024 * 1024;
    private static final int MAX_REGISTROS = 1000;
    private static final List<String> ENCABEZADOS =
            List.of("fecha", "monto", "moneda", "comercio", "categoria", "tarjetaId", "tipo");

    public List<MovimientoImportado> parsear(byte[] contenido) {
        if (contenido == null || contenido.length == 0 || contenido.length > MAX_FILE_BYTES) {
            throw solicitudInvalida();
        }

        String csv;
        try {
            csv = StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(contenido))
                    .toString();
        } catch (CharacterCodingException exception) {
            throw solicitudInvalida();
        }

        try (CSVParser parser = CSVParser.parse(new StringReader(csv), CSVFormat.RFC4180)) {
            Iterator<CSVRecord> registros = parser.iterator();
            if (!registros.hasNext() || !esEncabezadoValido(registros.next())) {
                throw solicitudInvalida();
            }

            List<MovimientoImportado> movimientos = new ArrayList<>();
            while (registros.hasNext()) {
                if (movimientos.size() == MAX_REGISTROS) {
                    throw solicitudInvalida();
                }
                movimientos.add(parsearRegistro(registros.next()));
            }
            if (movimientos.isEmpty()) {
                throw solicitudInvalida();
            }
            return List.copyOf(movimientos);
        } catch (IOException | UncheckedIOException exception) {
            throw solicitudInvalida();
        }
    }

    private boolean esEncabezadoValido(CSVRecord encabezado) {
        if (encabezado.size() != ENCABEZADOS.size()) {
            return false;
        }
        for (int columna = 0; columna < ENCABEZADOS.size(); columna++) {
            if (!ENCABEZADOS.get(columna).equals(encabezado.get(columna))) {
                return false;
            }
        }
        return true;
    }

    private MovimientoImportado parsearRegistro(CSVRecord registro) {
        if (registro.size() != ENCABEZADOS.size()) {
            throw solicitudInvalida();
        }
        try {
            String tarjeta = registro.get(5);
            return new MovimientoImportado(
                    LocalDate.parse(registro.get(0)),
                    new BigDecimal(registro.get(1)),
                    Moneda.valueOf(registro.get(2)),
                    registro.get(3),
                    registro.get(4),
                    tarjeta.isEmpty() ? null : UUID.fromString(tarjeta),
                    TipoMovimiento.valueOf(registro.get(6)));
        } catch (DateTimeException | IllegalArgumentException exception) {
            throw solicitudInvalida();
        }
    }

    private IllegalArgumentException solicitudInvalida() {
        return new IllegalArgumentException("CSV inválido");
    }
}
