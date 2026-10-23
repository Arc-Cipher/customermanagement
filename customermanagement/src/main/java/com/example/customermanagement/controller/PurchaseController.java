package com.example.customermanagement.controller;

import com.example.customermanagement.dto.PageResponse;
import com.example.customermanagement.dto.PurchaseRequest;
import com.example.customermanagement.dto.PurchaseResponse;
import com.example.customermanagement.service.PurchaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.security.Principal;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
public class PurchaseController {

    private final PurchaseService purchaseService;

    @PostMapping
    public ResponseEntity<PurchaseResponse> create(@Valid @RequestBody PurchaseRequest request,
                                                   Principal principal) {
        PurchaseResponse created = purchaseService.create(request, principal.getName());
        return ResponseEntity.created(URI.create("/api/purchases/" + created.id())).body(created);
    }

    @GetMapping("/{id}")
    public PurchaseResponse getById(@PathVariable Long id) {
        return purchaseService.getById(id);
    }

    // purchase history of one customer, newest first
    @GetMapping("/customer/{customerId}")
    public PageResponse<PurchaseResponse> listByCustomer(
            @PathVariable Long customerId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return purchaseService.listByCustomer(customerId, pageable);
    }
}
