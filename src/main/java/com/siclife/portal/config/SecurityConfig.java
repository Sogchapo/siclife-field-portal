package com.siclife.portal.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable CSRF for development API calls
            .headers(headers -> headers.frameOptions(frame -> frame.disable())) // Allow H2 Console
            .authorizeHttpRequests(auth -> auth
                // Public access to Static Frontend Resources
                .requestMatchers("/", "/index.html", "/css/**", "/js/**","/images/**","/login", "/pages/**").permitAll()
                
                // Public access to H2 Console, Authentication, Forms, Users, and Activity Logs
                .requestMatchers(
                    "/h2-console/**", 
                    "/api/auth/**", 
                    "/api/forms/**", 
                    "/api/users/**", 
                    "/api/logs/**"
                ).permitAll()
                
                .anyRequest().authenticated()
            )
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable()); // Disable default browser authentication popups

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}