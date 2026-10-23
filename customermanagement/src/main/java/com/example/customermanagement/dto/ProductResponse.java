package com.example.customermanagement.dto;

import java.math.BigDecimal;

public record ProductResponse(
        Long id,
        String name,
        String barcode,
        BigDecimal price,
        int stockQuantity,
        int lowStockThreshold,
        Long categoryId,
        String categoryName,
        boolean active
) {
}
