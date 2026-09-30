package com.siclife.portal.controller;

import com.siclife.portal.model.ActivityLog;
import com.siclife.portal.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
public class ActivityLogController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<ActivityLog>> getActivityLogs() {
        return ResponseEntity.ok(userService.getActivityLogs());
    }
}