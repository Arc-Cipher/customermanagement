package com.example.customermanagement.controller;

import com.example.customermanagement.dto.StaffCreateRequest;
import com.example.customermanagement.dto.StaffResponse;
import com.example.customermanagement.service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StaffResponse create(@Valid @RequestBody StaffCreateRequest request) {
        return staffService.create(request);
    }

    @GetMapping
    public List<StaffResponse> list() {
        return staffService.list();
    }

    @PostMapping("/{id}/activate")
    public StaffResponse activate(@PathVariable Long id, Principal principal) {
        return staffService.setActive(id, true, principal.getName());
    }

    @PostMapping("/{id}/deactivate")
    public StaffResponse deactivate(@PathVariable Long id, Principal principal) {
        return staffService.setActive(id, false, principal.getName());
    }
}
