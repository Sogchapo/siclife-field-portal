package com.siclife.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "proposal_forms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProposalForm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String policyType; // e.g., "Education Plan", "Family Care", "Keyman Insurance"

    @Column(nullable = false)
    private String clientFullName;

    @Column(nullable = false)
    private String clientPhone;

    private String clientEmail;

    @Column(nullable = false)
    private Double premiumAmount;

    @Column(nullable = false)
    private String agentUsername;

    private LocalDateTime submittedAt;

    @PrePersist
    protected void onCreate() {
        this.submittedAt = LocalDateTime.now();
    }
}