package com.example.kcdemo;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/aclaraciones")
public class AclaracionesController {

	private static final String ESTATUS_PENDIENTE = "pendiente";
	private static final String ESTATUS_APROBADA = "aprobada";
	private static final List<Aclaracion> ACLARACIONES_DEMO = List.of(
		new Aclaracion(1L, "Solicitud de prueba", ESTATUS_PENDIENTE),
		new Aclaracion(2L, "Solicitud pendiente de revisión", ESTATUS_PENDIENTE)
	);

	@GetMapping
	@PreAuthorize("hasRole('ver-menu')")
	public List<Aclaracion> aclaraciones() {
		return ACLARACIONES_DEMO;
	}

	@PostMapping("/{id}/aprobar")
	@PreAuthorize("hasRole('autorizar')")
	public Aprobacion aprobar(@PathVariable long id) {
		return new Aprobacion(id, ESTATUS_APROBADA);
	}

	public record Aclaracion(long id, String descripcion, String estatus) {
	}

	public record Aprobacion(long id, String estatus) {
	}
}