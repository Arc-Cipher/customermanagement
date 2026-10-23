package com.example.customermanagement.mapper;

import com.example.customermanagement.dto.CustomerCreateRequest;
import com.example.customermanagement.dto.CustomerResponse;
import com.example.customermanagement.dto.CustomerUpdateRequest;
import com.example.customermanagement.entity.Customer;
import com.example.customermanagement.entity.Staff;
import org.springframework.stereotype.Component;

@Component
public class CustomerMapper {

    public Customer toEntity(CustomerCreateRequest request, Staff createdBy) {
        Customer customer = new Customer();
        customer.setName(request.name().trim());
        customer.setPhone(request.phone());
        customer.setEmail(blankToNull(request.email()));
        customer.setAddress(blankToNull(request.address()));
        customer.setMarketingConsent(Boolean.TRUE.equals(request.marketingConsent()));
        customer.setCreatedBy(createdBy);
        return customer;
    }

    public void applyUpdate(Customer customer, CustomerUpdateRequest request) {
        customer.setName(request.name().trim());
        customer.setPhone(request.phone());
        customer.setEmail(blankToNull(request.email()));
        customer.setAddress(blankToNull(request.address()));
        customer.setMarketingConsent(Boolean.TRUE.equals(request.marketingConsent()));
    }

    public CustomerResponse toResponse(Customer c) {
        return new CustomerResponse(
                c.getId(),
                c.getName(),
                c.getPhone(),
                c.getEmail(),
                c.getAddress(),
                c.getLoyaltyPoints(),
                c.getStatus(),
                c.isMarketingConsent(),
                c.getCreatedBy() == null ? null : c.getCreatedBy().getName(),
                c.getCreatedAt(),
                c.getUpdatedAt());
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
