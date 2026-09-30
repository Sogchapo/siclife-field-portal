package com.siclife.portal.controller;

import com.siclife.portal.model.User;
import com.siclife.portal.payload.UserRegistrationRequest;
import com.siclife.portal.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // Allows cross-origin API calls from dashboard.js
public class AdminController {

    @Autowired
    private UserService userService;

    // Fetch all users (Matches dashboard.js loadUserManagement())
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // Toggle user status (Matches dashboard.js toggleUserStatus())
    @PutMapping("/{username}/status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable String username, @RequestParam boolean enable) {
        try {
            userService.setUserStatus(username, enable);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Admin creates new user (Agent, Supervisor, Admin)
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserRegistrationRequest request) {
        try {
            User newUser = User.builder()
                    .fullName(request.getFullName())
                    .username(request.getUsername())
                    .password(request.getPassword())
                    .email(request.getEmail())
                    .role(request.getRole())
                    .active(true)
                    .build();

            User savedUser = userService.registerUser(newUser);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}