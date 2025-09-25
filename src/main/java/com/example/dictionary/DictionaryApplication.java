package com.example.dictionary;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import jakarta.annotation.PostConstruct;

@SpringBootApplication
public class DictionaryApplication {

	public static void main(String[] args) {
		SpringApplication.run(DictionaryApplication.class, args);
	}
	
	@PostConstruct
	   public void init() {
	       TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
	       System.out.println("Default Timezone set to UTC");
	   }
}
