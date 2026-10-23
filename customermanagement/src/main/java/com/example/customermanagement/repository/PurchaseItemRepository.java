package com.example.customermanagement.repository;

import com.example.customermanagement.dto.TopProductResponse;
import com.example.customermanagement.entity.PurchaseItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PurchaseItemRepository extends JpaRepository<PurchaseItem, Long> {

    @Query("""
            SELECT new com.example.customermanagement.dto.TopProductResponse(
                pr.id, pr.name, SUM(i.quantity))
            FROM PurchaseItem i JOIN i.product pr
            GROUP BY pr.id, pr.name
            ORDER BY SUM(i.quantity) DESC
            """)
    List<TopProductResponse> findTopProducts(Pageable pageable);
}
