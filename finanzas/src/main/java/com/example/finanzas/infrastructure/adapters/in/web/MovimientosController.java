package com.example.finanzas.infrastructure.adapters.in.web;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
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
 * @modified 2026-09-30
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
    private final OwnerSubResolver ownerSubResolver;

    public MovimientosController(
            CrearMovimiento crearMovimiento,
            ListarMovimientos listarMovimientos,
            ObtenerMovimiento obtenerMovimiento,
            ActualizarMovimiento actualizarMovimiento,
            EliminarMovimiento eliminarMovimiento,
            ConsultarResumenMensual consultarResumenMensual,
            OwnerSubResolver ownerSubResolver) {
        this.crearMovimiento = crearMovimiento;
        this.listarMovimientos = listarMovimientos;
        this.obtenerMovimiento = obtenerMovimiento;
        this.actualizarMovimiento = actualizarMovimiento;
        this.eliminarMovimiento = eliminarMovimiento;
        this.consultarResumenMensual = consultarResumenMensual;
        this.ownerSubResolver = ownerSubResolver;
    }

    @GetMapping
    public List<MovimientoResponse> listar(
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-User-Sub", required = false) String requestedOwnerSub) {
        return listarMovimientos.ejecutar(resolvedOwnerSub(jwt, requestedOwnerSub)).stream()
                .map(MovimientoResponse::desde)
                .toList();
    }

    @GetMapping("/{id}")
    public MovimientoResponse obtener(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-User-Sub", required = false) String requestedOwnerSub) {
        return MovimientoResponse.desde(obtenerMovimiento.ejecutar(id, resolvedOwnerSub(jwt, requestedOwnerSub)));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MovimientoResponse crear(
            @Valid @RequestBody MovimientoRequest request,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-User-Sub", required = false) String requestedOwnerSub) {
        Movimiento creado = crearMovimiento.ejecutar(
                resolvedOwnerSub(jwt, requestedOwnerSub),
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
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-User-Sub", required = false) String requestedOwnerSub) {
        Movimiento actualizado = actualizarMovimiento.ejecutar(
                id,
                resolvedOwnerSub(jwt, requestedOwnerSub),
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
    public void eliminar(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-User-Sub", required = false) String requestedOwnerSub) {
        eliminarMovimiento.ejecutar(id, resolvedOwnerSub(jwt, requestedOwnerSub));
    }

    @GetMapping("/resumen-mensual")
    public List<ResumenCategoriaResponse> resumenMensual(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth periodo,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-User-Sub", required = false) String requestedOwnerSub) {
        return consultarResumenMensual.ejecutar(resolvedOwnerSub(jwt, requestedOwnerSub), periodo).stream()
                .map(ResumenCategoriaResponse::desde)
                .toList();
    }

    private String resolvedOwnerSub(Jwt jwt, String requestedOwnerSub) {
        return ownerSubResolver.resolver(jwt, requestedOwnerSub);
    }
}
