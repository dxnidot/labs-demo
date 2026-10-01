package com.example.finanzas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Inicia el microservicio local de finanzas personales.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
@SpringBootApplication
public class FinanzasApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinanzasApplication.class, args);
    }
}
