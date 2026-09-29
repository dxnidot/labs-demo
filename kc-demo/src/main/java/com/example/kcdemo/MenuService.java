package com.example.kcdemo;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

@Service
public class MenuService {

    private final MenuProperties menuProperties;

    public MenuService(MenuProperties menuProperties) {
        this.menuProperties = menuProperties;
    }

    public List<MenuItem> menuPara(Set<String> roles) {
        Set<String> usuarioRoles = roles == null ? Set.of() : roles;
        return menuProperties.opciones().stream()
                .filter(opcion -> usuarioRoles.contains(opcion.rol()))
                .map(opcion -> new MenuItem(
                        opcion.clave(),
                        opcion.titulo(),
                        opcion.ruta(),
                        opcion.acciones() == null
                                ? List.of()
                                : opcion.acciones().stream()
                                        .filter(accion -> usuarioRoles.contains(accion.rol()))
                                        .map(MenuProperties.Accion::clave)
                                        .toList()))
                .toList();
    }
}