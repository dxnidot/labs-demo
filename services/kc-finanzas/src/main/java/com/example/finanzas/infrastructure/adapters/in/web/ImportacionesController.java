package com.example.finanzas.infrastructure.adapters.in.web;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.finanzas.application.importaciones.MovimientoImportado;
import com.example.finanzas.application.usecases.ConfirmarImportacion;
import com.example.finanzas.application.usecases.PrevisualizarImportacion;

/**
 * Expone preview y confirmación autenticados de archivos CSV de movimientos.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@RestController
@RequestMapping("/api/finanzas/importaciones")
public class ImportacionesController {

    private final CsvImportacionParser parser;
    private final PrevisualizarImportacion previsualizarImportacion;
    private final ConfirmarImportacion confirmarImportacion;

    public ImportacionesController(
            CsvImportacionParser parser,
            PrevisualizarImportacion previsualizarImportacion,
            ConfirmarImportacion confirmarImportacion) {
        this.parser = parser;
        this.previsualizarImportacion = previsualizarImportacion;
        this.confirmarImportacion = confirmarImportacion;
    }

    @PostMapping(path = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportacionPreviewResponse preview(
            @RequestParam("archivo") MultipartFile archivo,
            @AuthenticationPrincipal Jwt jwt) {
        String ownerSub = subject(jwt);
        if (archivo == null || archivo.isEmpty() || archivo.getSize() > CsvImportacionParser.MAX_FILE_BYTES) {
            throw new IllegalArgumentException("CSV inválido");
        }

        byte[] contenido;
        try (var input = archivo.getInputStream()) {
            contenido = input.readNBytes(CsvImportacionParser.MAX_FILE_BYTES + 1);
        } catch (IOException exception) {
            throw new IllegalArgumentException("CSV inválido");
        }
        List<MovimientoImportado> movimientos = parser.parsear(contenido);
        UUID importId = previsualizarImportacion.ejecutar(ownerSub, movimientos);
        return new ImportacionPreviewResponse(
                importId,
                movimientos.size(),
                movimientos.stream().map(MovimientoImportadoResponse::desde).toList());
    }

    @PostMapping("/{id}/confirmar")
    public ConfirmacionImportacionResponse confirmar(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        return new ConfirmacionImportacionResponse(
                confirmarImportacion.ejecutar(id, subject(jwt)));
    }

    private String subject(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new IllegalArgumentException("Sujeto autenticado inválido");
        }
        return jwt.getSubject();
    }
}
