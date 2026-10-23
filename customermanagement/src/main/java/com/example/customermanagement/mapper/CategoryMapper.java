package com.example.customermanagement.mapper;

import com.example.customermanagement.dto.CategoryResponse;
import com.example.customermanagement.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public CategoryResponse toResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName());
    }
}
