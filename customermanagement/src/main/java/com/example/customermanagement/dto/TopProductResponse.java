package com.example.customermanagement.dto;

public record TopProductResponse(
        Long productId,
        String name,
        Long totalQuantitySold
) {
}
