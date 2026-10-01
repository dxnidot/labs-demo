package com.example.finanzas.infrastructure.adapters.in.web;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.finanzas.application.usecases.ActualizarTarjeta;
import com.example.finanzas.application.usecases.ConsultarCalendario;
import com.example.finanzas.application.usecases.CrearTarjeta;
import com.example.finanzas.application.usecases.EliminarTarjeta;
import com.example.finanzas.application.usecases.ListarTarjetas;
import com.example.finanzas.application.usecases.ObtenerTarjeta;
import com.example.finanzas.domain.tarjeta.EventoCalendario;
import com.example.finanzas.domain.tarjeta.Tarjeta;

/**
 * Adapta las solicitudes HTTP a los casos de uso de tarjetas y calendario.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified 2026-09-30
 */
@Validated
@RestController
@RequestMapping("/api/finanzas")
public class TarjetasController {

    private final CrearTarjeta crearTarjeta;
    private final ListarTarjetas listarTarjetas;
    private final ObtenerTarjeta obtenerTarjeta;
    private final ActualizarTarjeta actualizarTarjeta;
    private final EliminarTarjeta eliminarTarjeta;
    private final ConsultarCalendario consultarCalendario;
    private final OwnerSubResolver ownerSubResolver;

    public TarjetasController(
            CrearTarjeta crearTarjeta,
            ListarTarjetas listarTarjetas,
            ObtenerTarjeta obtenerTarjeta,
            ActualizarTarjeta actualizarTarjeta,
            EliminarTarjeta eliminarTarjeta,
            ConsultarCalendario consultarCalendario,
            OwnerSubResolver ownerSubResolver) {
        this.crearTarjeta = crearTarjeta;
        this.listarTarjetas = listarTarjetas;
        this.obtenerTarjeta = obtenerTarjeta;
        this.actualizarTarjeta = actualizarTarjeta;
        this.eliminarTarjeta = eliminarTarjeta;
        this.consultarCalendario = consultarCalendario;
        this.ownerSubResolver = ownerSubResolver;
    }

    @GetMapping("/tarjetas")
    public List<TarjetaResponse> listarTarjetas(
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-User-Sub", required = false) String requestedOwnerSub) {
        return listarTarjetas.ejecutar(resolvedOwnerSub(jwt, requestedOwnerSub)).stream()
                .map(TarjetaResponse::desde)
                .toList();
    }

    @GetMapping("/tarjetas/{id}")
    public TarjetaResponse obtenerTarjeta(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-User-Sub", required = false) String requestedOwnerSub) {
        return TarjetaResponse.desde(obtenerTarjeta.ejecutar(id, resolvedOwnerSub(jwt, requestedOwnerSub)));
    }

    @PostMapping("/tarjetas")
    @ResponseStatus(HttpStatus.CREATED)
    public TarjetaResponse crearTarjeta(
            @Valid @RequestBody TarjetaRequest request,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-User-Sub", required = false) String requestedOwnerSub) {
        Tarjeta creada = crearTarjeta.ejecutar(
                resolvedOwnerSub(jwt, requestedOwnerSub),
                request.alias(),
                request.ultimos4(),
                request.diaCorte(),
                request.diaPago(),
                request.permiteLiquidarMsiAnticipado(),
                request.activa());
        return TarjetaResponse.desde(creada);
    }

    @PutMapping("/tarjetas/{id}")
    public TarjetaResponse actualizarTarjeta(
            @PathVariable UUID id,
            @Valid @RequestBody TarjetaRequest request,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-User-Sub", required = false) String requestedOwnerSub) {
        Tarjeta actualizada = actualizarTarjeta.ejecutar(
                id,
                resolvedOwnerSub(jwt, requestedOwnerSub),
                request.alias(),
                request.ultimos4(),
                request.diaCorte(),
                request.diaPago(),
                request.permiteLiquidarMsiAnticipado(),
                request.activa());
        return TarjetaResponse.desde(actualizada);
    }

    @DeleteMapping("/tarjetas/{id}")
    public void eliminarTarjeta(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-User-Sub", required = false) String requestedOwnerSub) {
        eliminarTarjeta.ejecutar(id, resolvedOwnerSub(jwt, requestedOwnerSub));
    }

    @GetMapping("/calendario")
    public List<EventoCalendarioResponse> consultarCalendario(
            @RequestParam LocalDate desde,
            @RequestParam(defaultValue = "60") @Min(1) @Max(3660) int dias,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-User-Sub", required = false) String requestedOwnerSub) {
        List<EventoCalendario> eventos = consultarCalendario.ejecutar(
                resolvedOwnerSub(jwt, requestedOwnerSub), desde, dias);
        return eventos.stream().map(EventoCalendarioResponse::desde).toList();
    }

    private String resolvedOwnerSub(Jwt jwt, String requestedOwnerSub) {
        return ownerSubResolver.resolver(jwt, requestedOwnerSub);
    }
}
