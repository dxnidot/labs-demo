package com.example.kcdemo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

class MenuServiceTests {

    // Role and menu keys are part of the configured menu contract.
    private static final String ROLE_VIEW = "ver-menu";
    private static final String ROLE_APPROVE = "autorizar";
    private static final String ROLE_ADMIN = "admin-seguridad";

    @Test
    void filtersMenuItemsAndActionsByRoles() {
        MenuProperties properties = new MenuProperties(List.of(
                new MenuProperties.Opcion("aclaraciones", "Aclaraciones", "/aclaraciones", ROLE_VIEW, List.of(
                        new MenuProperties.Accion("consultar", ROLE_VIEW),
                        new MenuProperties.Accion("aprobar", ROLE_APPROVE))),
                new MenuProperties.Opcion("admin", "Administracion", "/admin", ROLE_ADMIN, List.of())));
        MenuService service = new MenuService(properties);

        List<MenuItem> actual = service.menuPara(Set.of(ROLE_VIEW));

        assertEquals(List.of(new MenuItem("aclaraciones", "Aclaraciones", "/aclaraciones", List.of("consultar"))),
                actual);
    }

    @Test
    void returnsNoItemsWhenRolesAreNull() {
        MenuProperties properties = new MenuProperties(List.of(
                new MenuProperties.Opcion("aclaraciones", "Aclaraciones", "/aclaraciones", ROLE_VIEW, List.of())));
        MenuService service = new MenuService(properties);

        List<MenuItem> actual = service.menuPara(null);

        assertTrue(actual.isEmpty());
    }

    @Test
    void mapsNullActionListToEmptyList() {
        MenuProperties properties = new MenuProperties(List.of(
                new MenuProperties.Opcion("admin", "Administracion", "/admin", ROLE_ADMIN, null)));
        MenuService service = new MenuService(properties);

        List<MenuItem> actual = service.menuPara(Set.of(ROLE_ADMIN));

        assertEquals(List.of(new MenuItem("admin", "Administracion", "/admin", List.of())), actual);
    }
}