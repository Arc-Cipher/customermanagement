package com.example.customermanagement.dto;

import com.example.customermanagement.enums.Role;

public record StaffResponse(
        Long id,
        String name,
        String username,
        Role role,
        boolean active
) {
}
