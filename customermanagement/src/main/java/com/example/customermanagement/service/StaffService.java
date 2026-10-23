package com.example.customermanagement.service;

import com.example.customermanagement.dto.StaffCreateRequest;
import com.example.customermanagement.dto.StaffResponse;
import com.example.customermanagement.entity.Staff;
import com.example.customermanagement.exception.BadRequestException;
import com.example.customermanagement.exception.DuplicateResourceException;
import com.example.customermanagement.exception.ResourceNotFoundException;
import com.example.customermanagement.mapper.StaffMapper;
import com.example.customermanagement.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffService {

    private final StaffRepository staffRepository;
    private final StaffMapper staffMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public StaffResponse create(StaffCreateRequest request) {
        String username = request.username().trim();
        if (staffRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("Username '" + username + "' is already taken");
        }
        Staff staff = new Staff();
        staff.setName(request.name().trim());
        staff.setUsername(username);
        staff.setPassword(passwordEncoder.encode(request.password()));
        staff.setRole(request.role());
        return staffMapper.toResponse(staffRepository.save(staff));
    }

    public List<StaffResponse> list() {
        return staffRepository.findAll().stream().map(staffMapper::toResponse).toList();
    }

    public StaffResponse getByUsername(String username) {
        Staff staff = staffRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + username));
        return staffMapper.toResponse(staff);
    }

    @Transactional
    public StaffResponse setActive(Long id, boolean active, String currentUsername) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with id " + id));
        if (!active && staff.getUsername().equals(currentUsername)) {
            throw new BadRequestException("You cannot deactivate your own account");
        }
        staff.setActive(active);
        return staffMapper.toResponse(staff);
    }
}
