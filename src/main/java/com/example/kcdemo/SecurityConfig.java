package com.example.kcdemo;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

	@Bean
	SecurityFilterChain securityFilterChain(
			HttpSecurity http,
			JwtAuthenticationConverter jwtAuthenticationConverter) throws Exception {
		http
			.authorizeHttpRequests(authorize -> authorize
				.anyRequest().authenticated()
			)
			.oauth2ResourceServer(oauth2 -> oauth2
				.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
			);
		return http.build();
	}

	@Bean
	JwtAuthenticationConverter jwtAuthenticationConverter() {
		JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
		converter.setJwtGrantedAuthoritiesConverter(this::clientRoleAuthorities);
		return converter;
	}

	private Collection<GrantedAuthority> clientRoleAuthorities(Jwt jwt) {
		Object resourceAccess = jwt.getClaims().get("resource_access");
		if (!(resourceAccess instanceof Map<?, ?> resources)) {
			return List.of();
		}

		Object chatApi = resources.get("chat-api");
		if (!(chatApi instanceof Map<?, ?> client)) {
			return List.of();
		}

		Object roles = client.get("roles");
		if (!(roles instanceof Collection<?> roleNames)) {
			return List.of();
		}

		return roleNames.stream()
			.filter(String.class::isInstance)
			.map(String.class::cast)
			.map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role))
			.toList();
	}
}