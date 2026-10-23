package com.example.customermanagement.mapper;

import com.example.customermanagement.dto.ProductRequest;
import com.example.customermanagement.dto.ProductResponse;
import com.example.customermanagement.entity.Category;
import com.example.customermanagement.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    private static final int DEFAULT_LOW_STOCK_THRESHOLD = 10;

    public Product toEntity(ProductRequest request, Category category) {
        Product product = new Product();
        applyUpdate(product, request, category);
        return product;
    }

    public void applyUpdate(Product product, ProductRequest request, Category category) {
        product.setName(request.name().trim());
        product.setBarcode(request.barcode().trim());
        product.setPrice(request.price());
        product.setStockQuantity(request.stockQuantity());
        product.setLowStockThreshold(request.lowStockThreshold() == null
                ? DEFAULT_LOW_STOCK_THRESHOLD
                : request.lowStockThreshold());
        product.setCategory(category);
    }

    public ProductResponse toResponse(Product p) {
        return new ProductResponse(
                p.getId(),
                p.getName(),
                p.getBarcode(),
                p.getPrice(),
                p.getStockQuantity(),
                p.getLowStockThreshold(),
                p.getCategory().getId(),
                p.getCategory().getName(),
                p.isActive());
    }
}
