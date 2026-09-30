package com.siclife.portal.repository;

import com.siclife.portal.model.ProposalForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProposalFormRepository extends JpaRepository<ProposalForm, Long> {

    // Count submissions within date ranges
    long countBySubmittedAtBetween(LocalDateTime start, LocalDateTime end);

    // Find top agent for the current month
    @Query("SELECT p.agentUsername, COUNT(p) as total FROM ProposalForm p " +
           "WHERE p.submittedAt >= :startOfMonth GROUP BY p.agentUsername ORDER BY total DESC")
    List<Object[]> findTopAgentForMonth(LocalDateTime startOfMonth);
}