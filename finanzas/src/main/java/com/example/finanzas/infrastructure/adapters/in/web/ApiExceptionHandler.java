package com.example.finanzas.infrastructure.adapters.in.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

import com.example.finanzas.application.importaciones.ImportacionNoEncontradaException;
import com.example.finanzas.application.importaciones.ImportacionPropiedadException;
import com.example.finanzas.domain.movimiento.MovimientoNoEncontradoException;
import com.example.finanzas.domain.tarjeta.TarjetaNoEncontradaException;

/**
 * Traduce errores de entrada, acceso y dominio a respuestas HTTP explícitas.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified 2026-09-30
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(TarjetaNoEncontradaException.class)
    public ResponseEntity<ApiError> tarjetaNoEncontrada(TarjetaNoEncontradaException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(exception.getMessage()));
    }

    @ExceptionHandler(MovimientoNoEncontradoException.class)
    public ResponseEntity<ApiError> movimientoNoEncontrado(MovimientoNoEncontradoException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(exception.getMessage()));
    }

    @ExceptionHandler(ImportacionNoEncontradaException.class)
    public ResponseEntity<ApiError> importacionNoEncontrada(ImportacionNoEncontradaException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(exception.getMessage()));
    }

    @ExceptionHandler(ImportacionPropiedadException.class)
    public ResponseEntity<ApiError> importacionDeOtroPropietario(ImportacionPropiedadException exception) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiError("Acceso denegado"));
    }

    @ExceptionHandler({
            IllegalArgumentException.class,
            MethodArgumentNotValidException.class,
            HandlerMethodValidationException.class
    })
    public ResponseEntity<ApiError> solicitudInvalida(Exception exception) {
        return ResponseEntity.badRequest().body(new ApiError("Solicitud inválida"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> accesoDenegado(AccessDeniedException exception) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiError("Acceso denegado"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> errorInesperado(Exception exception) {
        if (exception instanceof ErrorResponse errorResponse) {
            return ResponseEntity.status(errorResponse.getStatusCode())
                    .body(new ApiError("Solicitud rechazada"));
        }

        logger.error("Error interno al atender solicitud", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError("Error interno"));
    }
}
