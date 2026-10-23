package com.example.customermanagement.dto;

import java.math.BigDecimal;

public record TopCustomerResponse(
        Long customerId,
        String name,
        String phone,
        BigDecimal totalSpent,
        Long purchaseCount
) {
}
