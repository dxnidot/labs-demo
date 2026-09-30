package com.example.kcdemo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class MenuServiceTests {

    // Role and menu keys are part of the configured menu contract.
    private static final String ROLE_VIEW = "ver-menu";
    private static final String ROLE_APPROVE = "autorizar";
    private static final String ROLE_ADMIN = "admin-seguridad";

    @Test
    @DisplayName("Filtra las opciones y acciones del menú según los roles")
    void filtersMenuItemsAndActionsByRoles() {
        MenuProperties properties = new MenuProperties(List.of(
                new MenuProperties.Opcion("resumen", "Resumen", "/resumen", ROLE_VIEW, List.of(
                        new MenuProperties.Accion("consultar", ROLE_VIEW))),
                new MenuProperties.Opcion("autorizaciones", "Bandeja de autorizaciones", "/autorizaciones",
                        ROLE_APPROVE, List.of(new MenuProperties.Accion("aprobar", ROLE_APPROVE))),
                new MenuProperties.Opcion("administracion", "Administracion", "/admin", ROLE_ADMIN, List.of())));
        MenuService service = new MenuService(properties);

        List<MenuItem> menuVerMenu = service.menuPara(Set.of(ROLE_VIEW));
        List<MenuItem> menuVerMenuYAutorizar = service.menuPara(Set.of(ROLE_VIEW, ROLE_APPROVE));

        assertEquals(List.of(new MenuItem("resumen", "Resumen", "/resumen", List.of("consultar"))), menuVerMenu);
        assertEquals(List.of(
                new MenuItem("resumen", "Resumen", "/resumen", List.of("consultar")),
                new MenuItem("autorizaciones", "Bandeja de autorizaciones", "/autorizaciones", List.of("aprobar"))),
                menuVerMenuYAutorizar);
    }

    @Test
    @DisplayName("No devuelve opciones cuando los roles son nulos")
    void returnsNoItemsWhenRolesAreNull() {
        MenuProperties properties = new MenuProperties(List.of(
                new MenuProperties.Opcion("resumen", "Resumen", "/resumen", ROLE_VIEW, List.of())));
        MenuService service = new MenuService(properties);

        List<MenuItem> actual = service.menuPara(null);

        assertTrue(actual.isEmpty());
    }

    @Test
    @DisplayName("Convierte una lista nula de acciones en una lista vacía")
    void mapsNullActionListToEmptyList() {
        MenuProperties properties = new MenuProperties(List.of(
                new MenuProperties.Opcion("admin", "Administracion", "/admin", ROLE_ADMIN, null)));
        MenuService service = new MenuService(properties);

        List<MenuItem> actual = service.menuPara(Set.of(ROLE_ADMIN));

        assertEquals(List.of(new MenuItem("admin", "Administracion", "/admin", List.of())), actual);
    }
}