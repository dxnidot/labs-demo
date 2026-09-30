package com.example.kcdemo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

class MenuControllerTests {

    // These role strings are part of the authority format consumed by the
    // controller.
    private static final String ROLE_AUTORIZAR = "ROLE_autorizar";
    private static final String SCOPE_EMAIL = "SCOPE_email";

    @Test
    @DisplayName("Delega solo los nombres de rol distintos")
    void delegatesOnlyDistinctRoleNames() {
        MenuService menuService = mock(MenuService.class);
        List<MenuItem> expected = List.of(new MenuItem("autorizaciones", "Bandeja de autorizaciones",
                "/autorizaciones", List.of("aprobar")));
        when(menuService.menuPara(Set.of("autorizar"))).thenReturn(expected);
        MenuController controller = new MenuController(menuService);
        GrantedAuthority missingAuthority = () -> null;
        Authentication authentication = new UsernamePasswordAuthenticationToken("user", "credentials", List.of(
                new SimpleGrantedAuthority(ROLE_AUTORIZAR),
                new SimpleGrantedAuthority(SCOPE_EMAIL),
                new SimpleGrantedAuthority(ROLE_AUTORIZAR),
                missingAuthority));

        List<MenuItem> actual = controller.menu(authentication);

        assertEquals(expected, actual);
        verify(menuService).menuPara(Set.of("autorizar"));
    }

    @Test
    @DisplayName("Devuelve el menú del servicio cuando no hay roles")
    void returnsServiceMenuWhenAuthenticationHasNoRoles() {
        MenuService menuService = mock(MenuService.class);
        when(menuService.menuPara(Set.of())).thenReturn(List.of());
        MenuController controller = new MenuController(menuService);
        Authentication authentication = new UsernamePasswordAuthenticationToken("user", "credentials",
                List.of(new SimpleGrantedAuthority(SCOPE_EMAIL)));

        List<MenuItem> actual = controller.menu(authentication);

        assertTrue(actual.isEmpty());
        verify(menuService).menuPara(Set.of());
    }
}