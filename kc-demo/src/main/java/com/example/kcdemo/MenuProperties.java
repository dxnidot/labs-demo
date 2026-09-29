package com.example.kcdemo;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "menu")
public record MenuProperties(List<Opcion> opciones) {

    public record Opcion(String clave, String titulo, String ruta, String rol, List<Accion> acciones) {
    }

    public record Accion(String clave, String rol) {
    }
}