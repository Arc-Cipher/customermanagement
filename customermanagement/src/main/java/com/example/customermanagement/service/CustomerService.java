package com.example.customermanagement.service;

import com.example.customermanagement.dto.CustomerCreateRequest;
import com.example.customermanagement.dto.CustomerResponse;
import com.example.customermanagement.dto.CustomerUpdateRequest;
import com.example.customermanagement.dto.PageResponse;
import com.example.customermanagement.entity.Customer;
import com.example.customermanagement.entity.Staff;
import com.example.customermanagement.enums.CustomerStatus;
import com.example.customermanagement.exception.DuplicateResourceException;
import com.example.customermanagement.exception.ResourceNotFoundException;
import com.example.customermanagement.mapper.CustomerMapper;
import com.example.customermanagement.repository.CustomerRepository;
import com.example.customermanagement.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final StaffRepository staffRepository;
    private final CustomerMapper customerMapper;

    @Transactional
    public CustomerResponse create(CustomerCreateRequest request, String staffUsername) {
        if (customerRepository.existsByPhone(request.phone())) {
            throw new DuplicateResourceException("A customer with phone " + request.phone() + " already exists");
        }
        Staff staff = staffRepository.findByUsername(staffUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + staffUsername));

        Customer saved = customerRepository.save(customerMapper.toEntity(request, staff));
        return customerMapper.toResponse(saved);
    }

    public CustomerResponse getById(Long id) {
        return customerMapper.toResponse(findOrThrow(id));
    }

    public CustomerResponse getByPhone(String phone) {
        Customer customer = customerRepository.findByPhone(phone)
                .orElseThrow(() -> new ResourceNotFoundException("No customer with phone " + phone));
        return customerMapper.toResponse(customer);
    }

    public PageResponse<CustomerResponse> list(String q, CustomerStatus status, Pageable pageable) {
        Page<Customer> page = (q == null || q.isBlank())
                ? customerRepository.findByStatus(status, pageable)
                : customerRepository.search(status, q.trim(), pageable);
        return PageResponse.from(page.map(customerMapper::toResponse));
    }

    @Transactional
    public CustomerResponse update(Long id, CustomerUpdateRequest request) {
        Customer customer = findOrThrow(id);
        boolean phoneChanged = !customer.getPhone().equals(request.phone());
        if (phoneChanged && customerRepository.existsByPhone(request.phone())) {
            throw new DuplicateResourceException("A customer with phone " + request.phone() + " already exists");
        }
        customerMapper.applyUpdate(customer, request);
        return customerMapper.toResponse(customer);
    }

    // soft delete: purchase history stays intact
    @Transactional
    public void deactivate(Long id) {
        findOrThrow(id).setStatus(CustomerStatus.INACTIVE);
    }

    @Transactional
    public CustomerResponse reactivate(Long id) {
        Customer customer = findOrThrow(id);
        customer.setStatus(CustomerStatus.ACTIVE);
        return customerMapper.toResponse(customer);
    }

    private Customer findOrThrow(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id " + id));
    }
}
