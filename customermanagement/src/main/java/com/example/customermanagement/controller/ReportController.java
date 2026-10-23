package com.example.customermanagement.controller;

import com.example.customermanagement.dto.ProductResponse;
import com.example.customermanagement.dto.TopCustomerResponse;
import com.example.customermanagement.dto.TopProductResponse;
import com.example.customermanagement.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/top-customers")
    public List<TopCustomerResponse> topCustomers(@RequestParam(defaultValue = "10") int limit) {
        return reportService.topCustomers(clamp(limit));
    }

    @GetMapping("/top-products")
    public List<TopProductResponse> topProducts(@RequestParam(defaultValue = "10") int limit) {
        return reportService.topProducts(clamp(limit));
    }

    @GetMapping("/low-stock")
    public List<ProductResponse> lowStock() {
        return reportService.lowStock();
    }

    private int clamp(int limit) {
        return Math.max(1, Math.min(limit, 50));
    }
}
