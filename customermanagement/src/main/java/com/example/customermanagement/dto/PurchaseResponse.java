package com.example.customermanagement.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PurchaseResponse(
        Long id,
        Long customerId,
        String customerName,
        String cashierName,
        List<PurchaseItemResponse> items,
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal totalAmount,
        int pointsEarned,
        int pointsRedeemed,
        LocalDateTime createdAt
) {
}
