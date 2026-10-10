package com.example.finanzas.infrastructure.adapters.in.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Verifica la resolución segura del propietario a partir del JWT y X-User-Sub.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
class OwnerSubResolverTests {

    private static final String CLIENT_ID = "finanzas-agent";
    private final OwnerSubResolver resolver = new OwnerSubResolver(CLIENT_ID);

    @Test
    @DisplayName("Mantiene el sub del JWT usuario cuando no se envía X-User-Sub")
    void keepsUserSubjectWhenHeaderIsAbsent() {
        // Arrange
        Jwt userJwt = jwt("usuario-ficticio", Map.of());

        // Act
        String ownerSub = resolver.resolver(userJwt, null);

        // Assert
        assertEquals("usuario-ficticio", ownerSub);
    }

    @Test
    @DisplayName("Permite X-User-Sub al cliente esperado con el rol en su namespace")
    void acceptsAuthorizedClientAndHeader() {
        // Arrange
        Jwt agentJwt = authorizedAgentJwt();

        // Act
        String ownerSub = resolver.resolver(agentJwt, "propietario-ficticio");

        // Assert
        assertEquals("propietario-ficticio", ownerSub);
    }

    @Test
    @DisplayName("Rechaza al cliente autorizado si falta X-User-Sub")
    void rejectsAuthorizedClientWithoutHeader() {
        // Arrange
        Jwt agentJwt = authorizedAgentJwt();

        // Act / Assert
        assertThrows(AccessDeniedException.class, () -> resolver.resolver(agentJwt, null));
    }

    @Test
    @DisplayName("Rechaza X-User-Sub vacío o en blanco para el cliente autorizado")
    void rejectsBlankHeaderForAuthorizedClient() {
        // Arrange
        Jwt agentJwt = authorizedAgentJwt();

        // Act / Assert
        assertThrows(AccessDeniedException.class, () -> resolver.resolver(agentJwt, "  "));
    }

    @Test
    @DisplayName("Rechaza X-User-Sub de un JWT usuario sin alterar el sub normal")
    void rejectsUserHeaderInsteadOfFallingBackToUserSubject() {
        // Arrange
        Jwt userJwt = jwt("usuario-ficticio", Map.of());

        // Act / Assert
        assertThrows(AccessDeniedException.class,
                () -> resolver.resolver(userJwt, "otro-propietario-ficticio"));
    }

    @Test
    @DisplayName("Rechaza el cliente esperado cuando el rol está en otro namespace")
    void rejectsRoleFromDifferentClientNamespace() {
        // Arrange
        Jwt agentJwt = jwt("cliente-ficticio", Map.of(
                "azp", CLIENT_ID,
                "resource_access", Map.of("otro-cliente", Map.of("roles", List.of("usar-finanzas")))));

        // Act / Assert
        assertThrows(AccessDeniedException.class,
                () -> resolver.resolver(agentJwt, "propietario-ficticio"));
    }

    @Test
    @DisplayName("Rechaza X-User-Sub si el azp no coincide")
    void rejectsHeaderForUnexpectedAuthorizedParty() {
        // Arrange
        Jwt agentJwt = jwt("cliente-ficticio", Map.of(
                "azp", "otro-cliente",
                "resource_access", Map.of(CLIENT_ID, Map.of("roles", List.of("usar-finanzas")))));

        // Act / Assert
        assertThrows(AccessDeniedException.class,
                () -> resolver.resolver(agentJwt, "propietario-ficticio"));
    }

    @Test
    @DisplayName("Rechaza X-User-Sub cuando el cliente esperado carece del rol")
    void rejectsHeaderWhenClientRoleIsMissing() {
        // Arrange
        Jwt agentJwt = jwt("cliente-ficticio", Map.of(
                "azp", CLIENT_ID,
                "resource_access", Map.of(CLIENT_ID, Map.of("roles", List.of("otro-rol")))));

        // Act / Assert
        assertThrows(AccessDeniedException.class,
                () -> resolver.resolver(agentJwt, "propietario-ficticio"));
    }

    private Jwt authorizedAgentJwt() {
        return jwt("cliente-ficticio", Map.of(
                "azp", CLIENT_ID,
                "resource_access", Map.of(CLIENT_ID, Map.of("roles", List.of("usar-finanzas")))));
    }

    private Jwt jwt(String subject, Map<String, Object> additionalClaims) {
        Map<String, Object> claims = new java.util.HashMap<>(additionalClaims);
        claims.put("sub", subject);
        claims.put("iss", "https://issuer-ficticio.invalid/realms/lab");
        claims.put("iat", Instant.parse("2026-09-30T00:00:00Z"));
        claims.put("exp", Instant.parse("2026-10-01T00:00:00Z"));
        return new Jwt(
                "token-sintetico-de-prueba",
                Instant.parse("2026-09-30T00:00:00Z"),
                Instant.parse("2026-10-01T00:00:00Z"),
                Map.of("alg", "RS256"),
                claims);
    }
}
