package com.example.finanzas.infrastructure.adapters.in.web;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
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

    public TarjetasController(
            CrearTarjeta crearTarjeta,
            ListarTarjetas listarTarjetas,
            ObtenerTarjeta obtenerTarjeta,
            ActualizarTarjeta actualizarTarjeta,
            EliminarTarjeta eliminarTarjeta,
            ConsultarCalendario consultarCalendario) {
        this.crearTarjeta = crearTarjeta;
        this.listarTarjetas = listarTarjetas;
        this.obtenerTarjeta = obtenerTarjeta;
        this.actualizarTarjeta = actualizarTarjeta;
        this.eliminarTarjeta = eliminarTarjeta;
        this.consultarCalendario = consultarCalendario;
    }

    @GetMapping("/tarjetas")
    public List<TarjetaResponse> listarTarjetas(@AuthenticationPrincipal Jwt jwt) {
        return listarTarjetas.ejecutar(subject(jwt)).stream().map(TarjetaResponse::desde).toList();
    }

    @GetMapping("/tarjetas/{id}")
    public TarjetaResponse obtenerTarjeta(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return TarjetaResponse.desde(obtenerTarjeta.ejecutar(id, subject(jwt)));
    }

    @PostMapping("/tarjetas")
    @ResponseStatus(HttpStatus.CREATED)
    public TarjetaResponse crearTarjeta(
            @Valid @RequestBody TarjetaRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Tarjeta creada = crearTarjeta.ejecutar(
                subject(jwt),
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
            @AuthenticationPrincipal Jwt jwt) {
        Tarjeta actualizada = actualizarTarjeta.ejecutar(
                id,
                subject(jwt),
                request.alias(),
                request.ultimos4(),
                request.diaCorte(),
                request.diaPago(),
                request.permiteLiquidarMsiAnticipado(),
                request.activa());
        return TarjetaResponse.desde(actualizada);
    }

    @DeleteMapping("/tarjetas/{id}")
    public void eliminarTarjeta(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        eliminarTarjeta.ejecutar(id, subject(jwt));
    }

    @GetMapping("/calendario")
    public List<EventoCalendarioResponse> consultarCalendario(
            @RequestParam LocalDate desde,
            @RequestParam(defaultValue = "60") @Min(1) @Max(3660) int dias,
            @AuthenticationPrincipal Jwt jwt) {
        List<EventoCalendario> eventos = consultarCalendario.ejecutar(subject(jwt), desde, dias);
        return eventos.stream().map(EventoCalendarioResponse::desde).toList();
    }

    private String subject(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new AccessDeniedException("El token no contiene un sujeto válido");
        }
        return jwt.getSubject();
    }
}
