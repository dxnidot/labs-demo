package com.example.kcdemo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;

class SecurityConfigTests {

    private static final Instant ISSUED_AT = Instant.parse("2026-01-01T00:00:00Z");
    private static final Instant EXPIRES_AT = Instant.parse("2027-01-01T00:00:00Z");

    @Test
    void convertsOnlyStringRolesFromChatApiClient() {
        Map<String, Object> claims = Map.of("resource_access", Map.of("chat-api", Map.of(
                "roles", Arrays.asList("ver-menu", "autorizar", 42, null))));

        Set<String> authorities = authoritiesFor(claims);

        assertEquals(Set.of("ROLE_ver-menu", "ROLE_autorizar"), authorities);
    }

    @Test
    void returnsNoAuthoritiesWhenResourceAccessIsMissing() {
        assertTrue(authoritiesFor(Map.of()).isEmpty());
    }

    @Test
    void returnsNoAuthoritiesWhenResourceAccessIsNotAMap() {
        assertTrue(authoritiesFor(Map.of("resource_access", "invalid")).isEmpty());
    }

    @Test
    void returnsNoAuthoritiesWhenChatApiClientIsMissing() {
        assertTrue(authoritiesFor(Map.of("resource_access", Map.of())).isEmpty());
    }

    @Test
    void returnsNoAuthoritiesWhenClientRolesAreNotACollection() {
        assertTrue(authoritiesFor(Map.of("resource_access", Map.of("chat-api", Map.of("roles", "invalid")))).isEmpty());
    }

    private Set<String> authoritiesFor(Map<String, Object> claims) {
        Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "none")
                .issuedAt(ISSUED_AT)
                .expiresAt(EXPIRES_AT)
                .claims(values -> values.putAll(claims))
                .build();
        JwtAuthenticationConverter converter = new SecurityConfig().jwtAuthenticationConverter();

        return converter.convert(jwt).getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .collect(Collectors.toSet());
    }
}