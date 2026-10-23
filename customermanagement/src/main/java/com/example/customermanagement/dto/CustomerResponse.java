package com.example.customermanagement.dto;

import com.example.customermanagement.enums.CustomerStatus;

import java.time.LocalDateTime;

public record CustomerResponse(
        Long id,
        String name,
        String phone,
        String email,
        String address,
        int loyaltyPoints,
        CustomerStatus status,
        boolean marketingConsent,
        String createdByName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
