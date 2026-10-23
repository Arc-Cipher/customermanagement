package com.example.customermanagement.service;

import com.example.customermanagement.dto.PageResponse;
import com.example.customermanagement.dto.PurchaseItemRequest;
import com.example.customermanagement.dto.PurchaseRequest;
import com.example.customermanagement.dto.PurchaseResponse;
import com.example.customermanagement.entity.Customer;
import com.example.customermanagement.entity.Product;
import com.example.customermanagement.entity.Purchase;
import com.example.customermanagement.entity.PurchaseItem;
import com.example.customermanagement.entity.Staff;
import com.example.customermanagement.enums.CustomerStatus;
import com.example.customermanagement.exception.BadRequestException;
import com.example.customermanagement.exception.ResourceNotFoundException;
import com.example.customermanagement.mapper.PurchaseMapper;
import com.example.customermanagement.repository.CustomerRepository;
import com.example.customermanagement.repository.ProductRepository;
import com.example.customermanagement.repository.PurchaseRepository;
import com.example.customermanagement.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PurchaseService {

    // 1 redeemed point = Rs 1 off the bill
    private static final BigDecimal RUPEES_PER_REDEEMED_POINT = BigDecimal.ONE;
    // customer earns 1 point for every Rs 100 paid
    private static final BigDecimal SPEND_PER_EARNED_POINT = BigDecimal.valueOf(100);

    private final PurchaseRepository purchaseRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final StaffRepository staffRepository;
    private final PurchaseMapper purchaseMapper;

    /**
     * Creates a bill in one transaction: checks stock, reduces stock, applies points
     * discount, awards new points. If anything fails, everything is rolled back.
     */
    @Transactional
    public PurchaseResponse create(PurchaseRequest request, String cashierUsername) {
        Staff cashier = staffRepository.findByUsername(cashierUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + cashierUsername));

        Customer customer = null;
        if (request.customerId() != null) {
            customer = customerRepository.findById(request.customerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id " + request.customerId()));
            if (customer.getStatus() != CustomerStatus.ACTIVE) {
                throw new BadRequestException("This customer account is inactive");
            }
        }

        int pointsToRedeem = request.pointsToRedeem() == null ? 0 : request.pointsToRedeem();
        if (pointsToRedeem > 0) {
            if (customer == null) {
                throw new BadRequestException("Select a customer to redeem points");
            }
            if (pointsToRedeem > customer.getLoyaltyPoints()) {
                throw new BadRequestException("Customer only has " + customer.getLoyaltyPoints() + " points");
            }
        }

        // merge repeated products and sort by id, so row locks are always taken in the same order
        Map<Long, Integer> quantities = new TreeMap<>();
        for (PurchaseItemRequest item : request.items()) {
            quantities.merge(item.productId(), item.quantity(), Integer::sum);
        }

        Purchase purchase = new Purchase();
        purchase.setCustomer(customer);
        purchase.setCashier(cashier);

        BigDecimal subtotal = BigDecimal.ZERO;
        for (Map.Entry<Long, Integer> entry : quantities.entrySet()) {
            Product product = productRepository.findByIdForUpdate(entry.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + entry.getKey()));
            int quantity = entry.getValue();

            if (!product.isActive()) {
                throw new BadRequestException("Product '" + product.getName() + "' is no longer sold");
            }
            if (product.getStockQuantity() < quantity) {
                throw new BadRequestException("Not enough stock for '" + product.getName()
                        + "' (available: " + product.getStockQuantity() + ")");
            }
            product.setStockQuantity(product.getStockQuantity() - quantity);

            PurchaseItem item = new PurchaseItem();
            item.setProduct(product);
            item.setQuantity(quantity);
            item.setUnitPrice(product.getPrice());
            item.setLineTotal(product.getPrice().multiply(BigDecimal.valueOf(quantity)));
            purchase.addItem(item);

            subtotal = subtotal.add(item.getLineTotal());
        }

        BigDecimal discount = RUPEES_PER_REDEEMED_POINT.multiply(BigDecimal.valueOf(pointsToRedeem));
        if (discount.compareTo(subtotal) > 0) {
            throw new BadRequestException("Points to redeem are worth more than the bill amount");
        }
        BigDecimal total = subtotal.subtract(discount);

        int pointsEarned = 0;
        if (customer != null) {
            pointsEarned = total.divideToIntegralValue(SPEND_PER_EARNED_POINT).intValue();
            customer.setLoyaltyPoints(customer.getLoyaltyPoints() - pointsToRedeem + pointsEarned);
        }

        purchase.setSubtotal(subtotal);
        purchase.setDiscount(discount);
        purchase.setTotalAmount(total);
        purchase.setPointsEarned(pointsEarned);
        purchase.setPointsRedeemed(pointsToRedeem);

        return purchaseMapper.toResponse(purchaseRepository.save(purchase));
    }

    public PurchaseResponse getById(Long id) {
        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found with id " + id));
        return purchaseMapper.toResponse(purchase);
    }

    public PageResponse<PurchaseResponse> listByCustomer(Long customerId, Pageable pageable) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer not found with id " + customerId);
        }
        return PageResponse.from(purchaseRepository.findByCustomerId(customerId, pageable)
                .map(purchaseMapper::toResponse));
    }
}
