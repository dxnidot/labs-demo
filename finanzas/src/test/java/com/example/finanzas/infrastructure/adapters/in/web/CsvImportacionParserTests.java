package com.example.finanzas.infrastructure.adapters.in.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.example.finanzas.application.importaciones.MovimientoImportado;
import com.example.finanzas.domain.movimiento.Moneda;
import com.example.finanzas.domain.movimiento.TipoMovimiento;

/**
 * Verifica validación segura, límite de filas y compatibilidad RFC 4180 del parser CSV.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
class CsvImportacionParserTests {

    private final CsvImportacionParser parser = new CsvImportacionParser();

    @Test
    @DisplayName("Interpreta RFC 4180 y conserva campos entrecomillados con tarjeta opcional")
    void parsesRfc4180AndOptionalCard() {
        // Arrange
        String csv = "fecha,monto,moneda,comercio,categoria,tarjetaId,tipo\r\n"
                + "2026-09-20,12.50,MXN,\"Tienda, centro\",Comida,,GASTO\r\n";

        // Act
        List<MovimientoImportado> resultado = parser.parsear(bytes(csv));

        // Assert
        assertEquals(1, resultado.size());
        assertEquals(LocalDate.of(2026, 9, 20), resultado.get(0).fecha());
        assertEquals(Moneda.MXN, resultado.get(0).moneda());
        assertEquals("Tienda, centro", resultado.get(0).comercio());
        assertNull(resultado.get(0).tarjetaId());
        assertEquals(TipoMovimiento.GASTO, resultado.get(0).tipo());
    }

    @Test
    @DisplayName("Rechaza contenido vacío, UTF-8 inválido y encabezados no exactos")
    void rejectsEmptyInvalidUtf8AndInvalidHeaders() {
        // Arrange
        byte[] utfInvalido = {(byte) 0xc3, (byte) 0x28};
        String encabezadoDuplicado = "fecha,monto,moneda,comercio,categoria,tipo,tipo\n";
        String encabezadoExtra = "fecha,monto,moneda,comercio,categoria,tarjetaId,tipo,extra\n";
        String encabezadoIncorrecto = "Fecha,monto,moneda,comercio,categoria,tarjetaId,tipo\n";

        // Act / Assert
        assertThrows(IllegalArgumentException.class, () -> parser.parsear(new byte[0]));
        assertThrows(IllegalArgumentException.class, () -> parser.parsear(utfInvalido));
        assertThrows(IllegalArgumentException.class, () -> parser.parsear(bytes(encabezadoDuplicado)));
        assertThrows(IllegalArgumentException.class, () -> parser.parsear(bytes(encabezadoExtra)));
        assertThrows(IllegalArgumentException.class, () -> parser.parsear(bytes(encabezadoIncorrecto)));
    }

    @Test
    @DisplayName("Rechaza filas inválidas sin revelar contenido en el error")
    void rejectsInvalidRowsWithoutExposingCsvContent() {
        // Arrange
        String fila = "2026-02-30,0,EUR,SECRETO-COMERCIO,Categoria,,GASTO";
        String csv = "fecha,monto,moneda,comercio,categoria,tarjetaId,tipo\n" + fila + "\n";

        // Act
        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class, () -> parser.parsear(bytes(csv)));

        // Assert
        assertEquals("CSV inválido", error.getMessage());
    }

    @Test
    @DisplayName("Rechaza comillas RFC 4180 malformadas sin registrar ni devolver la fila")
    void rejectsMalformedCsvWithoutExposingRowContent() {
        // Arrange
        String csv = "fecha,monto,moneda,comercio,categoria,tarjetaId,tipo\n"
                + "2026-09-20,12.50,MXN,\"COMERCIO-PRIVADO,Categoria,,GASTO\n";

        // Act
        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class, () -> parser.parsear(bytes(csv)));

        // Assert
        assertEquals("CSV inválido", error.getMessage());
    }

    @Test
    @DisplayName("Rechaza el registro número 1001 y archivos sobre 1 MiB")
    void rejectsTooManyRowsAndOversizedFiles() {
        // Arrange
        StringBuilder csv = new StringBuilder("fecha,monto,moneda,comercio,categoria,tarjetaId,tipo\n");
        for (int fila = 0; fila < 1001; fila++) {
            csv.append("2026-09-20,1,MXN,Comercio,Categoria,,GASTO\n");
        }
        byte[] archivoGrande = new byte[CsvImportacionParser.MAX_FILE_BYTES + 1];

        // Act / Assert
        assertThrows(IllegalArgumentException.class, () -> parser.parsear(bytes(csv.toString())));
        assertThrows(IllegalArgumentException.class, () -> parser.parsear(archivoGrande));
    }

    private byte[] bytes(String csv) {
        return csv.getBytes(StandardCharsets.UTF_8);
    }
}
