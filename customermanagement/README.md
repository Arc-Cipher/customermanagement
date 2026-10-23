# Supermarket Customer Management - Backend

Spring Boot 4 + PostgreSQL (Docker) + Spring Security (HTTP Basic, stateless).

## Setup

1. Generate the project at start.spring.io (Maven, Java 21, Spring Boot 4.1.1,
   artifact `customermanagement`, package `com.example.customermanagement`) with:
   Spring Web, Spring Data JPA, Spring Security, PostgreSQL Driver, Lombok, **Validation**.
2. Copy `src/` from this zip into that project (overwrite `application.properties`).
   Keep the generated `pom.xml` and `CustomermanagementApplication.java`.
3. Put `docker-compose.yml` in the project root and run `docker compose up -d`.
4. Start the app. A default admin is created on first run:
   `admin` / `Admin@12345` (change it in `application.properties`).

If you ran an earlier version of the entities, reset the database first:
`docker compose down -v && docker compose up -d`.

## Roles

| Role    | Can do                                                                 |
|---------|------------------------------------------------------------------------|
| CASHIER | register customers, look up customers/products, create bills           |
| MANAGER | everything a cashier can + edit/deactivate customers, manage products and categories, reports |
| ADMIN   | everything + manage staff accounts                                     |

## Endpoints

| Method | Path | Who |
|--------|------|-----|
| GET | /api/auth/me | any staff |
| POST | /api/staff | ADMIN |
| GET | /api/staff | ADMIN |
| POST | /api/staff/{id}/activate, /deactivate | ADMIN |
| POST | /api/customers | any staff |
| GET | /api/customers?q=&status=&page=&size= | any staff |
| GET | /api/customers/{id}, /api/customers/phone/{phone} | any staff |
| PUT | /api/customers/{id} | MANAGER+ |
| DELETE | /api/customers/{id} (soft delete) | MANAGER+ |
| POST | /api/customers/{id}/reactivate | MANAGER+ |
| POST/PUT/DELETE | /api/categories, /api/categories/{id} | MANAGER+ |
| GET | /api/categories | any staff |
| POST/PUT/DELETE | /api/products, /api/products/{id} | MANAGER+ |
| PATCH | /api/products/{id}/stock | MANAGER+ |
| GET | /api/products?q=&categoryId=, /api/products/{id}, /api/products/barcode/{barcode} | any staff |
| POST | /api/purchases | any staff |
| GET | /api/purchases/{id}, /api/purchases/customer/{customerId} | any staff |
| GET | /api/reports/top-customers, /top-products, /low-stock | MANAGER+ |

## Business rules

- Phone must be a 10-digit Indian mobile number (starts with 6-9) and is unique.
- A bill reduces stock, and fails completely if any item lacks stock.
- 1 point is earned per Rs 100 paid; 1 redeemed point = Rs 1 off.
- Leave `customerId` out of a purchase for a walk-in customer.

## Quick test (curl)

```
curl -u admin:Admin@12345 http://localhost:8080/api/auth/me

curl -u admin:Admin@12345 -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" -d '{"name":"Dairy"}'

curl -u admin:Admin@12345 -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Milk 1L","barcode":"8901234567890","price":62.00,"stockQuantity":50,"categoryId":1}'

curl -u admin:Admin@12345 -X POST http://localhost:8080/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Ravi Sharma","phone":"9876543210"}'

curl -u admin:Admin@12345 -X POST http://localhost:8080/api/purchases \
  -H "Content-Type: application/json" \
  -d '{"customerId":1,"items":[{"productId":1,"quantity":3}]}'
```
