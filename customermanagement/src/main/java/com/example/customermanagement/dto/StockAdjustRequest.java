package com.example.customermanagement.dto;

import jakarta.validation.constraints.NotNull;

// positive number adds stock (new delivery), negative removes it (damaged, expired)
public record StockAdjustRequest(
        @NotNull(message = "Change is required")
        Integer change
) {
}
