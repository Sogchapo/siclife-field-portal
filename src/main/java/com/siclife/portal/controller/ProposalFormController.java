package com.siclife.portal.controller;

import com.siclife.portal.model.ProposalForm;
import com.siclife.portal.repository.ProposalFormRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/forms")
@CrossOrigin(origins = "*") // Allows local development requests from front-end
public class ProposalFormController {

    @Autowired
    private ProposalFormRepository proposalFormRepository;

    // Submit a new Proposal Form
    @PostMapping
    public ResponseEntity<?> submitForm(@RequestBody ProposalForm form) {
        if (form.getSubmittedAt() == null) {
            form.setSubmittedAt(LocalDateTime.now());
        }
        ProposalForm savedForm = proposalFormRepository.save(form);
        return ResponseEntity.ok(savedForm);
    }

    // Get Dashboard Metrics & Star Worker Stats
    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

        LocalDateTime startOfWeek = today.minusDays(today.getDayOfWeek().getValue() - 1).atStartOfDay();
        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();

        long todayCount = proposalFormRepository.countBySubmittedAtBetween(startOfDay, endOfDay);
        long weeklyCount = proposalFormRepository.countBySubmittedAtBetween(startOfWeek, endOfDay);
        long monthlyCount = proposalFormRepository.countBySubmittedAtBetween(startOfMonth, endOfDay);

        // Fetch Star Worker
        List<Object[]> topAgents = proposalFormRepository.findTopAgentForMonth(startOfMonth);
        String topAgent = "No submissions yet";
        long topAgentCount = 0;

        if (!topAgents.isEmpty()) {
            Object[] result = topAgents.get(0);
            topAgent = (String) result[0];
            topAgentCount = ((Number) result[1]).longValue(); // Safely converts Integer/Long DB return types
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("today", todayCount);
        stats.put("weekly", weeklyCount);
        stats.put("monthly", monthlyCount);
        stats.put("starWorker", topAgent);
        stats.put("starWorkerCount", topAgentCount);

        return ResponseEntity.ok(stats);
    }
}