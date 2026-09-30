package com.siclife.portal.controller;

import com.siclife.portal.model.User;
import com.siclife.portal.payload.LoginRequest;
import com.siclife.portal.repository.UserRepository;
import com.siclife.portal.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Added to allow seamless requests from your frontend
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        Optional<User> userOptional = userRepository.findByUsername(loginRequest.getUsername());

        if (userOptional.isPresent()) {
            User user = userOptional.get();

            // Verify account status
            if (!user.getActive()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Account is deactivated.");
            }

            // Verify password
            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                // Log login activity
                String ipAddress = request.getRemoteAddr();
                userService.logActivity(user.getUsername(), "LOGIN", ipAddress);

                Map<String, Object> response = new HashMap<>();
                response.put("message", "Login successful");
                response.put("username", user.getUsername());
                response.put("fullName", user.getFullName());
                response.put("role", user.getRole());
                return ResponseEntity.ok(response);
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestParam String username, HttpServletRequest request) {
        String ipAddress = request.getRemoteAddr();
        userService.logActivity(username, "LOGOUT", ipAddress);
        return ResponseEntity.ok("Logout successful");
    }
}