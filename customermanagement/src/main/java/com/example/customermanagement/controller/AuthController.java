package com.example.customermanagement.controller;

import com.example.customermanagement.dto.StaffResponse;
import com.example.customermanagement.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final StaffService staffService;

    // login check: returns who you are if your credentials are valid
    @GetMapping("/me")
    public StaffResponse me(Principal principal) {
        return staffService.getByUsername(principal.getName());
    }
}
