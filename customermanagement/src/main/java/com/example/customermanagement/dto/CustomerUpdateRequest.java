package com.example.customermanagement.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CustomerUpdateRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters")
        String name,

        @NotBlank(message = "Phone is required")
        @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Phone must be a valid 10-digit mobile number")
        String phone,

        @Email(message = "Email is invalid")
        @Size(max = 150, message = "Email must be at most 150 characters")
        String email,

        @Size(max = 255, message = "Address must be at most 255 characters")
        String address,

        Boolean marketingConsent
) {
}
