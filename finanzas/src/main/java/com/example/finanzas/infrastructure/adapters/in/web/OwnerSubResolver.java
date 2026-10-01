package com.example.finanzas.infrastructure.adapters.in.web;

import java.util.Collection;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Resuelve el propietario desde el JWT o desde una suplantación autorizada del agente.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@Component
public class OwnerSubResolver {

    private static final String AGENT_ROLE = "usar-finanzas";
    private static final String RESOURCE_ACCESS_CLAIM = "resource_access";
    private static final String ROLES_CLAIM = "roles";

    private final String agentClientId;

    public OwnerSubResolver(
            @Value("${finanzas.agent.client-id:finanzas-agent}") String agentClientId) {
        this.agentClientId = agentClientId;
    }

    public String resolver(Jwt jwt, String requestedOwnerSub) {
        if (jwt == null) {
            throw new AccessDeniedException("Se requiere un JWT validado");
        }

        boolean agentAuthorized = isAgentAuthorized(jwt);
        if (requestedOwnerSub != null) {
            if (!agentAuthorized || requestedOwnerSub.isBlank()) {
                throw new AccessDeniedException("X-User-Sub no está autorizado o está vacío");
            }
            return requestedOwnerSub;
        }

        if (agentAuthorized) {
            throw new AccessDeniedException("X-User-Sub es obligatorio para el cliente autorizado");
        }

        String subject = jwt.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new AccessDeniedException("El token no contiene un sujeto válido");
        }
        return subject;
    }

    private boolean isAgentAuthorized(Jwt jwt) {
        return agentClientId.equals(jwt.getClaim("azp")) && hasAgentRole(jwt);
    }

    private boolean hasAgentRole(Jwt jwt) {
        Object resourceAccessClaim = jwt.getClaims().get(RESOURCE_ACCESS_CLAIM);
        if (!(resourceAccessClaim instanceof Map<?, ?> resourceAccess)) {
            return false;
        }

        Object clientAccessClaim = resourceAccess.get(agentClientId);
        if (!(clientAccessClaim instanceof Map<?, ?> clientAccess)) {
            return false;
        }

        Object rolesClaim = clientAccess.get(ROLES_CLAIM);
        return rolesClaim instanceof Collection<?> roles && roles.contains(AGENT_ROLE);
    }
}
