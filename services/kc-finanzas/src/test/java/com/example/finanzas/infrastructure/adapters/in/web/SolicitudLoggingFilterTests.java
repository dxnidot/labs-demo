package com.example.finanzas.infrastructure.adapters.in.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.stream.Collectors;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.HandlerMapping;

/**
 * Verifica los metadatos seguros y niveles del log de solicitudes.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
class SolicitudLoggingFilterTests {

    private final Logger logger = (Logger) LoggerFactory.getLogger(SolicitudLoggingFilter.class);
    private final Level originalLevel = logger.getLevel();
    private final ListAppender<ILoggingEvent> appender = new ListAppender<>();

    SolicitudLoggingFilterTests() {
        appender.setContext((LoggerContext) LoggerFactory.getILoggerFactory());
        appender.start();
        logger.setLevel(Level.INFO);
        logger.addAppender(appender);
    }

    @AfterEach
    void limpiarAppender() {
        logger.detachAppender(appender);
        logger.setLevel(originalLevel);
        appender.stop();
    }

    @Test
    @DisplayName("Registra el patrón y estado sin incluir Authorization")
    void logsRouteAndStatusWithoutAuthorization() throws Exception {
        HttpServletRequest request = solicitud(
                "/api/finanzas/tarjetas/00000000-0000-0000-0000-000000000001");
        when(request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE))
                .thenReturn("/api/finanzas/tarjetas/{id}");
        HttpServletResponse response = mock(HttpServletResponse.class);
        when(response.getStatus()).thenReturn(HttpServletResponse.SC_OK);
        FilterChain chain = mock(FilterChain.class);

        new SolicitudLoggingFilter().doFilter(request, response, chain);

        ILoggingEvent event = solicitudAtendida();
        Map<String, Object> fields = fields(event);
        assertEquals(Level.INFO, event.getLevel());
        assertEquals("GET", fields.get("method"));
        assertEquals("/api/finanzas/tarjetas/{id}", fields.get("route"));
        assertEquals(200, fields.get("status"));
        assertTrue(fields.containsKey("durationMs"));
        assertFalse(camposYMensaje(event).contains("Authorization"));
        assertFalse(camposYMensaje(event).contains("token-ficticio"));
    }

    @Test
    @DisplayName("Registra una solicitud 401 en WARN con reason no_autenticado")
    void logsUnauthorizedRequestAsWarning() throws Exception {
        HttpServletRequest request = solicitud(
                "/api/finanzas/tarjetas/00000000-0000-0000-0000-000000000001");
        HttpServletResponse response = mock(HttpServletResponse.class);
        when(response.getStatus()).thenReturn(HttpServletResponse.SC_UNAUTHORIZED);
        FilterChain chain = mock(FilterChain.class);

        new SolicitudLoggingFilter().doFilter(request, response, chain);

        ILoggingEvent event = solicitudAtendida();
        Map<String, Object> fields = fields(event);
        assertEquals(Level.WARN, event.getLevel());
        assertEquals("GET", fields.get("method"));
        assertEquals("/api/finanzas/tarjetas/{id}", fields.get("route"));
        assertEquals(401, fields.get("status"));
        assertEquals("no_autenticado", fields.get("reason"));
        assertFalse(camposYMensaje(event).contains("Authorization"));
        assertFalse(camposYMensaje(event).contains("token-ficticio"));
    }

    private HttpServletRequest solicitud(String path) {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getDispatcherType()).thenReturn(DispatcherType.REQUEST);
        when(request.getMethod()).thenReturn("GET");
        when(request.getServletPath()).thenReturn(path);
        when(request.getAttribute(anyString())).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn("Bearer token-ficticio");
        return request;
    }

    private ILoggingEvent solicitudAtendida() {
        assertEquals(1, appender.list.size());
        ILoggingEvent event = appender.list.getFirst();
        assertEquals("Solicitud atendida", event.getFormattedMessage());
        return event;
    }

    private Map<String, Object> fields(ILoggingEvent event) {
        return event.getKeyValuePairs().stream()
                .collect(Collectors.toMap(pair -> pair.key, pair -> pair.value));
    }

    private String camposYMensaje(ILoggingEvent event) {
        return event.getFormattedMessage() + event.getKeyValuePairs();
    }
}
