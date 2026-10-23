package com.example.customermanagement.mapper;

import com.example.customermanagement.dto.StaffResponse;
import com.example.customermanagement.entity.Staff;
import org.springframework.stereotype.Component;

@Component
public class StaffMapper {

    public StaffResponse toResponse(Staff staff) {
        return new StaffResponse(
                staff.getId(),
                staff.getName(),
                staff.getUsername(),
                staff.getRole(),
                staff.isActive());
    }
}
