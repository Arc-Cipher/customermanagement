package com.example.customermanagement.repository;

import com.example.customermanagement.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByBarcode(String barcode);

    boolean existsByBarcode(String barcode);

    boolean existsByCategoryId(Long categoryId);

    Page<Product> findByActiveTrue(Pageable pageable);

    Page<Product> findByCategoryIdAndActiveTrue(Long categoryId, Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true
              AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR p.barcode LIKE CONCAT('%', :q, '%'))
            """)
    Page<Product> search(@Param("q") String q, Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true AND p.stockQuantity <= p.lowStockThreshold
            ORDER BY p.stockQuantity ASC
            """)
    List<Product> findLowStock();

    // row lock so two cashiers can't sell the last item at the same time
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}
