package com.example.customermanagement.config;

import com.example.customermanagement.entity.Staff;
import com.example.customermanagement.enums.Role;
import com.example.customermanagement.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin-username:admin}")
    private String adminUsername;

    @Value("${app.bootstrap.admin-password:Admin@12345}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (staffRepository.count() > 0) {
            return;
        }
        Staff admin = new Staff();
        admin.setName("System Admin");
        admin.setUsername(adminUsername);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ADMIN);
        staffRepository.save(admin);
        log.warn("Created default admin account '{}'. Change this password before real use.", adminUsername);
    }
}
