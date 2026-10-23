package com.example.customermanagement.security;

import com.example.customermanagement.entity.Staff;
import com.example.customermanagement.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final StaffRepository staffRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Staff staff = staffRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Staff not found: " + username));

        return User.withUsername(staff.getUsername())
                .password(staff.getPassword())          // already a BCrypt hash
                .roles(staff.getRole().name())          // becomes ROLE_CASHIER / ROLE_MANAGER / ROLE_ADMIN
                .disabled(!staff.isActive())
                .build();
    }
}
