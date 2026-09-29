package com.example.kcdemo;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DemoController {

	@GetMapping("/menu")
	@PreAuthorize("hasRole('ver-menu')")
	public String menu() {
		return "menu visible";
	}

	@GetMapping("/autorizar")
	@PreAuthorize("hasRole('autorizar')")
	public String autorizar() {
		return "autorizado";
	}
}