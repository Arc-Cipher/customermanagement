package com.example.customermanagement.mapper;

import com.example.customermanagement.dto.PurchaseItemResponse;
import com.example.customermanagement.dto.PurchaseResponse;
import com.example.customermanagement.entity.Purchase;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PurchaseMapper {

    public PurchaseResponse toResponse(Purchase p) {
        List<PurchaseItemResponse> items = p.getItems().stream()
                .map(i -> new PurchaseItemResponse(
                        i.getProduct().getId(),
                        i.getProduct().getName(),
                        i.getQuantity(),
                        i.getUnitPrice(),
                        i.getLineTotal()))
                .toList();

        return new PurchaseResponse(
                p.getId(),
                p.getCustomer() == null ? null : p.getCustomer().getId(),
                p.getCustomer() == null ? null : p.getCustomer().getName(),
                p.getCashier().getName(),
                items,
                p.getSubtotal(),
                p.getDiscount(),
                p.getTotalAmount(),
                p.getPointsEarned(),
                p.getPointsRedeemed(),
                p.getCreatedAt());
    }
}
