package com.example.kcdemo;

import java.util.List;

public record MenuItem(String clave, String titulo, String ruta, List<String> acciones) {
}