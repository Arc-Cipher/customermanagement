package com.example.customermanagement.service;

import com.example.customermanagement.dto.PageResponse;
import com.example.customermanagement.dto.ProductRequest;
import com.example.customermanagement.dto.ProductResponse;
import com.example.customermanagement.dto.StockAdjustRequest;
import com.example.customermanagement.entity.Category;
import com.example.customermanagement.entity.Product;
import com.example.customermanagement.exception.BadRequestException;
import com.example.customermanagement.exception.DuplicateResourceException;
import com.example.customermanagement.exception.ResourceNotFoundException;
import com.example.customermanagement.mapper.ProductMapper;
import com.example.customermanagement.repository.CategoryRepository;
import com.example.customermanagement.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;

    @Transactional
    public ProductResponse create(ProductRequest request) {
        String barcode = request.barcode().trim();
        if (productRepository.existsByBarcode(barcode)) {
            throw new DuplicateResourceException("A product with barcode " + barcode + " already exists");
        }
        Category category = findCategory(request.categoryId());
        Product saved = productRepository.save(productMapper.toEntity(request, category));
        return productMapper.toResponse(saved);
    }

    public ProductResponse getById(Long id) {
        return productMapper.toResponse(findOrThrow(id));
    }

    // the cashier scans a barcode at the counter
    public ProductResponse getByBarcode(String barcode) {
        Product product = productRepository.findByBarcode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException("No product with barcode " + barcode));
        return productMapper.toResponse(product);
    }

    public PageResponse<ProductResponse> list(String q, Long categoryId, Pageable pageable) {
        Page<Product> page;
        if (categoryId != null) {
            page = productRepository.findByCategoryIdAndActiveTrue(categoryId, pageable);
        } else if (q != null && !q.isBlank()) {
            page = productRepository.search(q.trim(), pageable);
        } else {
            page = productRepository.findByActiveTrue(pageable);
        }
        return PageResponse.from(page.map(productMapper::toResponse));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = findOrThrow(id);
        String barcode = request.barcode().trim();
        if (!product.getBarcode().equals(barcode) && productRepository.existsByBarcode(barcode)) {
            throw new DuplicateResourceException("A product with barcode " + barcode + " already exists");
        }
        Category category = findCategory(request.categoryId());
        productMapper.applyUpdate(product, request, category);
        return productMapper.toResponse(product);
    }

    // soft delete: old bills still reference this product
    @Transactional
    public void deactivate(Long id) {
        findOrThrow(id).setActive(false);
    }

    @Transactional
    public ProductResponse adjustStock(Long id, StockAdjustRequest request) {
        Product product = productRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
        int newStock = product.getStockQuantity() + request.change();
        if (newStock < 0) {
            throw new BadRequestException("Stock cannot go below zero (current stock: " + product.getStockQuantity() + ")");
        }
        product.setStockQuantity(newStock);
        return productMapper.toResponse(product);
    }

    public List<ProductResponse> lowStock() {
        return productRepository.findLowStock().stream().map(productMapper::toResponse).toList();
    }

    private Product findOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
    }

    private Category findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + id));
    }
}
