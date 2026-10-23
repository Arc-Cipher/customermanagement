package com.example.customermanagement.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // pure REST API with no browser cookies, so CSRF protection is not needed
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        // ADMIN only
                        .requestMatchers("/api/staff/**").hasRole("ADMIN")
                        // MANAGER and ADMIN only
                        .requestMatchers("/api/reports/**").hasAnyRole("MANAGER", "ADMIN")
                        // every logged-in staff member (cashier, manager, admin)
                        .requestMatchers(HttpMethod.GET, "/api/customers/**", "/api/products/**", "/api/categories/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/customers").authenticated()
                        .requestMatchers("/api/purchases/**").authenticated()
                        // everything else on these paths (update, delete, reactivate, manage products) is MANAGER and ADMIN
                        .requestMatchers("/api/customers/**", "/api/products/**", "/api/categories/**").hasAnyRole("MANAGER", "ADMIN")
                        .anyRequest().authenticated()
                );
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
