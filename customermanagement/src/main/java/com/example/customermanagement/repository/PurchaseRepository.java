package com.example.customermanagement.repository;

import com.example.customermanagement.dto.TopCustomerResponse;
import com.example.customermanagement.entity.Purchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    Page<Purchase> findByCustomerId(Long customerId, Pageable pageable);

    @Query("""
            SELECT new com.example.customermanagement.dto.TopCustomerResponse(
                c.id, c.name, c.phone, SUM(p.totalAmount), COUNT(p))
            FROM Purchase p JOIN p.customer c
            GROUP BY c.id, c.name, c.phone
            ORDER BY SUM(p.totalAmount) DESC
            """)
    List<TopCustomerResponse> findTopCustomers(Pageable pageable);
}
