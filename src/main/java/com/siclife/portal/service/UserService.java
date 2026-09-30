package com.siclife.portal.service;

import com.siclife.portal.model.ActivityLog;
import com.siclife.portal.model.Role;
import com.siclife.portal.model.User;
import com.siclife.portal.repository.ActivityLogRepository;
import com.siclife.portal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // 1. User Registration (Admin Only)
    public User registerUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username is already taken!");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email is already registered!");
        }

        // Encrypt password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    // 2. Fetch all users for Admin User Management Dashboard
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // 3. Record Login/Logout Events in Activity Log
    public void logActivity(String username, String action, String ipAddress) {
        User user = userRepository.findByUsername(username).orElse(null);
        ActivityLog log = ActivityLog.builder()
                .userId(user != null ? user.getId() : null)
                .username(username)
                .action(action)
                .ipAddress(ipAddress)
                .build();
        activityLogRepository.save(log);
    }

    // 4. Fetch Activity Logs (Admin & Supervisor Access)
    public List<ActivityLog> getActivityLogs() {
        return activityLogRepository.findByOrderByTimestampDesc();
    }

    // 5. Update/Toggle User Active Status (Admin Only)
    public void setUserStatus(String username, boolean enable) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
        user.setActive(enable);
        userRepository.save(user);
    }
}