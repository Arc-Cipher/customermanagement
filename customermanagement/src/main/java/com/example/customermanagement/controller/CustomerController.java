package com.example.customermanagement.controller;

import com.example.customermanagement.dto.CustomerCreateRequest;
import com.example.customermanagement.dto.CustomerResponse;
import com.example.customermanagement.dto.CustomerUpdateRequest;
import com.example.customermanagement.dto.PageResponse;
import com.example.customermanagement.enums.CustomerStatus;
import com.example.customermanagement.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.security.Principal;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    public ResponseEntity<CustomerResponse> create(@Valid @RequestBody CustomerCreateRequest request,
                                                   Principal principal) {
        CustomerResponse created = customerService.create(request, principal.getName());
        return ResponseEntity.created(URI.create("/api/customers/" + created.id())).body(created);
    }

    @GetMapping("/{id}")
    public CustomerResponse getById(@PathVariable Long id) {
        return customerService.getById(id);
    }

    // main lookup at the billing counter
    @GetMapping("/phone/{phone}")
    public CustomerResponse getByPhone(@PathVariable String phone) {
        return customerService.getByPhone(phone);
    }

    // ?q=search text (name or phone) &status=ACTIVE|INACTIVE &page=0 &size=20
    @GetMapping
    public PageResponse<CustomerResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "ACTIVE") CustomerStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return customerService.list(q, status, pageable);
    }

    @PutMapping("/{id}")
    public CustomerResponse update(@PathVariable Long id, @Valid @RequestBody CustomerUpdateRequest request) {
        return customerService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable Long id) {
        customerService.deactivate(id);
    }

    @PostMapping("/{id}/reactivate")
    public CustomerResponse reactivate(@PathVariable Long id) {
        return customerService.reactivate(id);
    }
}
