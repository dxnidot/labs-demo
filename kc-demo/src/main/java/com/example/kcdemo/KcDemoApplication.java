package com.example.kcdemo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class KcDemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(KcDemoApplication.class, args);
	}

}
