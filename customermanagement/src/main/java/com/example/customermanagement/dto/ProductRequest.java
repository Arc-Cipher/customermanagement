package com.example.customermanagement.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank(message = "Product name is required")
        @Size(max = 150, message = "Product name must be at most 150 characters")
        String name,

        @NotBlank(message = "Barcode is required")
        @Size(max = 50, message = "Barcode must be at most 50 characters")
        String barcode,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.01", message = "Price must be greater than 0")
        BigDecimal price,

        @NotNull(message = "Stock quantity is required")
        @Min(value = 0, message = "Stock cannot be negative")
        Integer stockQuantity,

        // optional, defaults to 10
        @Min(value = 0, message = "Low stock threshold cannot be negative")
        Integer lowStockThreshold,

        @NotNull(message = "Category is required")
        Long categoryId
) {
}
