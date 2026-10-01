package com.example.finanzas.infrastructure.adapters.in.web;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.finanzas.application.usecases.ActualizarMovimiento;
import com.example.finanzas.application.usecases.ConsultarResumenMensual;
import com.example.finanzas.application.usecases.CrearMovimiento;
import com.example.finanzas.application.usecases.EliminarMovimiento;
import com.example.finanzas.application.usecases.ListarMovimientos;
import com.example.finanzas.application.usecases.ObtenerMovimiento;
import com.example.finanzas.domain.movimiento.Movimiento;

/**
 * Adapta las solicitudes HTTP a las operaciones de movimientos y resumen mensual.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@RestController
@RequestMapping("/api/finanzas/movimientos")
public class MovimientosController {

    private final CrearMovimiento crearMovimiento;
    private final ListarMovimientos listarMovimientos;
    private final ObtenerMovimiento obtenerMovimiento;
    private final ActualizarMovimiento actualizarMovimiento;
    private final EliminarMovimiento eliminarMovimiento;
    private final ConsultarResumenMensual consultarResumenMensual;

    public MovimientosController(
            CrearMovimiento crearMovimiento,
            ListarMovimientos listarMovimientos,
            ObtenerMovimiento obtenerMovimiento,
            ActualizarMovimiento actualizarMovimiento,
            EliminarMovimiento eliminarMovimiento,
            ConsultarResumenMensual consultarResumenMensual) {
        this.crearMovimiento = crearMovimiento;
        this.listarMovimientos = listarMovimientos;
        this.obtenerMovimiento = obtenerMovimiento;
        this.actualizarMovimiento = actualizarMovimiento;
        this.eliminarMovimiento = eliminarMovimiento;
        this.consultarResumenMensual = consultarResumenMensual;
    }

    @GetMapping
    public List<MovimientoResponse> listar(@AuthenticationPrincipal Jwt jwt) {
        return listarMovimientos.ejecutar(subject(jwt)).stream()
                .map(MovimientoResponse::desde)
                .toList();
    }

    @GetMapping("/{id}")
    public MovimientoResponse obtener(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return MovimientoResponse.desde(obtenerMovimiento.ejecutar(id, subject(jwt)));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MovimientoResponse crear(@Valid @RequestBody MovimientoRequest request, @AuthenticationPrincipal Jwt jwt) {
        Movimiento creado = crearMovimiento.ejecutar(
                subject(jwt),
                request.fecha(),
                request.monto(),
                request.moneda(),
                request.comercio(),
                request.categoria(),
                request.tarjetaId(),
                request.origen(),
                request.tipo());
        return MovimientoResponse.desde(creado);
    }

    @PutMapping("/{id}")
    public MovimientoResponse actualizar(
            @PathVariable UUID id,
            @Valid @RequestBody MovimientoRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Movimiento actualizado = actualizarMovimiento.ejecutar(
                id,
                subject(jwt),
                request.fecha(),
                request.monto(),
                request.moneda(),
                request.comercio(),
                request.categoria(),
                request.tarjetaId(),
                request.origen(),
                request.tipo());
        return MovimientoResponse.desde(actualizado);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        eliminarMovimiento.ejecutar(id, subject(jwt));
    }

    @GetMapping("/resumen-mensual")
    public List<ResumenCategoriaResponse> resumenMensual(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth periodo,
            @AuthenticationPrincipal Jwt jwt) {
        return consultarResumenMensual.ejecutar(subject(jwt), periodo).stream()
                .map(ResumenCategoriaResponse::desde)
                .toList();
    }

    private String subject(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new AccessDeniedException("El token no contiene un sujeto válido");
        }
        return jwt.getSubject();
    }
}
