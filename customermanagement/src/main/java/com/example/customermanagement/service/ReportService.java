package com.example.customermanagement.service;

import com.example.customermanagement.dto.ProductResponse;
import com.example.customermanagement.dto.TopCustomerResponse;
import com.example.customermanagement.dto.TopProductResponse;
import com.example.customermanagement.repository.PurchaseItemRepository;
import com.example.customermanagement.repository.PurchaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final PurchaseRepository purchaseRepository;
    private final PurchaseItemRepository purchaseItemRepository;
    private final ProductService productService;

    public List<TopCustomerResponse> topCustomers(int limit) {
        return purchaseRepository.findTopCustomers(PageRequest.of(0, limit));
    }

    public List<TopProductResponse> topProducts(int limit) {
        return purchaseItemRepository.findTopProducts(PageRequest.of(0, limit));
    }

    public List<ProductResponse> lowStock() {
        return productService.lowStock();
    }
}
