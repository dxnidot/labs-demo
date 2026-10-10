package com.example.finanzas.infrastructure.adapters.in.web;

import java.io.IOException;
import java.util.regex.Pattern;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.spi.LoggingEventBuilder;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;

/**
 * Registra el resultado HTTP sin exponer datos confidenciales de la solicitud.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 2)
public class SolicitudLoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(SolicitudLoggingFilter.class);
    private static final Pattern UUID_PATTERN = Pattern.compile(
            "(?i)[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}");

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.equals("/actuator") || path.startsWith("/actuator/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        long startedAt = System.nanoTime();
        try {
            filterChain.doFilter(request, response);
        } finally {
            int status = response.getStatus();
            LoggingEventBuilder event = status < 400 ? logger.atInfo() : logger.atWarn();
            event.addKeyValue("method", request.getMethod())
                    .addKeyValue("route", routePattern(request))
                    .addKeyValue("status", status)
                    .addKeyValue("durationMs", (System.nanoTime() - startedAt) / 1_000_000);
            if (status >= 400 && status < 500) {
                event.addKeyValue("reason", reason(status));
            }
            event.log("Solicitud atendida");
        }
    }

    private String routePattern(HttpServletRequest request) {
        Object matchedPattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        if (matchedPattern != null) {
            return matchedPattern.toString();
        }

        String path = request.getServletPath();
        if (path.startsWith("/api/finanzas")) {
            return UUID_PATTERN.matcher(path).replaceAll("{id}");
        }
        return "unmapped";
    }

    private String reason(int status) {
        return switch (status) {
            case 400 -> "validacion";
            case 401 -> "no_autenticado";
            case 403 -> "sin_acceso";
            case 404 -> "no_encontrado";
            case 405 -> "metodo_no_permitido";
            default -> "solicitud_rechazada";
        };
    }
}
