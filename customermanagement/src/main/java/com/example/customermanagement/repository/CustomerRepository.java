package com.example.customermanagement.repository;

import com.example.customermanagement.entity.Customer;
import com.example.customermanagement.enums.CustomerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByPhone(String phone);

    boolean existsByPhone(String phone);

    Page<Customer> findByStatus(CustomerStatus status, Pageable pageable);

    // q must not be null (the service only calls this when there is a search text)
    @Query("""
            SELECT c FROM Customer c
            WHERE c.status = :status
              AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR c.phone LIKE CONCAT('%', :q, '%'))
            """)
    Page<Customer> search(@Param("status") CustomerStatus status,
                          @Param("q") String q,
                          Pageable pageable);
}
