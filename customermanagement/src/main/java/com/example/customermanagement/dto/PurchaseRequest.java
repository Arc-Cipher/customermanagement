package com.example.customermanagement.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record PurchaseRequest(
        // leave out for a walk-in customer
        Long customerId,

        @NotEmpty(message = "A bill needs at least one item")
        @Valid
        List<PurchaseItemRequest> items,

        // optional, 1 point = 1 rupee off
        @Min(value = 0, message = "Points to redeem cannot be negative")
        Integer pointsToRedeem
) {
}
