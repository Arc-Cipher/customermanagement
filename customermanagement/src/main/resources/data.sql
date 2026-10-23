-- ==========================================================
-- SUPERMART SUPERMARKET - MOCK DATA FOR DEMONSTRATION & TESTING
-- ==========================================================

-- 1. STAFF ACCOUNTS
-- Passwords:
-- admin: Admin@12345
-- manager: Manager@12345
-- cashier1: Cashier@12345
-- cashier2: Cashier@12345
INSERT INTO staff (id, name, username, password, role, active) VALUES
  (1, 'System Administrator', 'admin', '$2a$10$gg3/LpUGqwxQC97SbpCJUOPNdsxkGEZO4ptfVDmW5arUIv0lhTWFm', 'ADMIN', true),
  (2, 'Vikram Mehta (Store Manager)', 'manager', '$2a$10$2x8rvUrH3NQUa4lCwDk4IO7nf4lBpMlSUrO7a41xHQZXsJYYDapPq', 'MANAGER', true),
  (3, 'Ananya Roy (Counter 1)', 'cashier1', '$2a$10$lnBIGz9nR/BCygAjRpmqwu2BiJ1nTaIc1lgXyDiuGNM45zdsySLYm', 'CASHIER', true),
  (4, 'Suresh Kumar (Counter 2)', 'cashier2', '$2a$10$lnBIGz9nR/BCygAjRpmqwu2BiJ1nTaIc1lgXyDiuGNM45zdsySLYm', 'CASHIER', true)
ON CONFLICT (id) DO NOTHING;

-- 2. PRODUCT CATEGORIES
INSERT INTO categories (id, name) VALUES
  (1, 'Dairy & Eggs'),
  (2, 'Fruits & Vegetables'),
  (3, 'Bakery & Snacks'),
  (4, 'Beverages'),
  (5, 'Grains & Staples'),
  (6, 'Personal Care & Hygiene'),
  (7, 'Household & Cleaning')
ON CONFLICT (id) DO NOTHING;

-- 3. CUSTOMER MEMBERS
INSERT INTO customers (id, name, phone, email, address, loyalty_points, status, marketing_consent, created_by, created_at, updated_at) VALUES
  (1, 'Rahul Sharma', '9876543210', 'rahul.sharma@example.com', 'Flat 402, Green Glen Layout, Bengaluru', 450, 'ACTIVE', true, 1, '2026-09-01 10:00:00', '2026-10-15 14:30:00'),
  (2, 'Priya Patel', '9823456789', 'priya.patel@example.com', '12/A, MG Road, Pune', 120, 'ACTIVE', true, 2, '2026-09-05 11:15:00', '2026-10-12 18:20:00'),
  (3, 'Amitabh Verma', '9911223344', 'amitabh.verma@example.com', 'Sector 45, DLF Phase 4, Gurugram', 890, 'ACTIVE', true, 1, '2026-08-20 09:45:00', '2026-10-18 16:10:00'),
  (4, 'Sneha Kulkarni', '9765432109', 'sneha.k@example.com', 'BTM 2nd Stage, Bengaluru', 210, 'ACTIVE', false, 3, '2026-09-15 16:30:00', '2026-10-08 11:00:00'),
  (5, 'Rajesh Nair', '9845012345', 'rajesh.nair@example.com', 'Indiranagar 100ft Road, Bengaluru', 65, 'ACTIVE', true, 3, '2026-10-01 14:00:00', '2026-10-14 12:45:00'),
  (6, 'Meera Iyer', '9819087654', 'meera.iyer@example.com', 'Chembur West, Mumbai', 15, 'ACTIVE', true, 4, '2026-10-05 17:20:00', '2026-10-16 19:15:00'),
  (7, 'Sunil Rao (Deactivated)', '9988776655', NULL, 'HSR Layout Sector 1, Bengaluru', 0, 'INACTIVE', false, 1, '2026-07-10 12:00:00', '2026-09-30 08:00:00')
ON CONFLICT (id) DO NOTHING;

-- 4. PRODUCTS & INVENTORY
-- (Includes low stock alerts and 0-stock items for alert testing)
INSERT INTO products (id, name, barcode, price, stock_quantity, low_stock_threshold, category_id, active) VALUES
  -- Dairy & Eggs (Category 1)
  (1, 'Amul Taaza Homogenised Toned Milk 1L', '8901262010053', 72.00, 45, 15, 1, true),
  (2, 'Amul Butter Pasteurised 500g', '8901262010121', 275.00, 30, 10, 1, true),
  (3, 'Farm Fresh Brown Eggs (Pack of 6)', '8908001234567', 65.00, 7, 10, 1, true), -- Low Stock
  (4, 'Mother Dairy Malai Paneer 200g', '8901648001201', 95.00, 4, 10, 1, true), -- Low Stock
  -- Fruits & Vegetables (Category 2)
  (5, 'Fresh Cavendish Bananas 1 Dozen', '8901234001011', 60.00, 50, 15, 2, true),
  (6, 'Shimla Royal Delicious Apple 1kg', '8901234001028', 180.00, 25, 10, 2, true),
  (7, 'Fresh Hybrid Red Tomatoes 1kg', '8901234001035', 40.00, 35, 15, 2, true),
  (8, 'Fresh Jyoti Potatoes 1kg', '8901234001042', 32.00, 60, 20, 2, true),
  -- Bakery & Snacks (Category 3)
  (9, 'Britannia 100% Whole Wheat Bread 400g', '8901063132115', 45.00, 20, 10, 3, true),
  (10, 'Parle-G Gold Glucose Biscuits 1kg', '8901719101010', 110.00, 40, 12, 3, true),
  (11, 'Haldiram Nagpur Aloo Bhujia 400g', '8904063200114', 115.00, 3, 10, 3, true), -- Low Stock
  (12, 'Lays Indias Magic Masala Chips 50g', '8901491101017', 20.00, 80, 20, 3, true),
  -- Beverages (Category 4)
  (13, 'Tata Tea Gold Leaf 500g', '8901052001058', 320.00, 30, 8, 4, true),
  (14, 'Nescafe Classic 100% Pure Coffee 100g Jar', '8901058852333', 345.00, 25, 8, 4, true),
  (15, 'Coca-Cola Soft Drink 750ml PET Bottle', '8901764012224', 40.00, 60, 15, 4, true),
  (16, 'Real Fruit Power Mixed Fruit Juice 1L', '8901207010058', 125.00, 2, 10, 4, true), -- Low Stock
  -- Grains & Staples (Category 5)
  (17, 'India Gate Basmati Rice Feast Rozzana 5kg', '8906001020054', 485.00, 18, 5, 5, true),
  (18, 'Aashirvaad Shudh Chakki Atta 5kg', '8901030383723', 265.00, 22, 10, 5, true),
  (19, 'Fortune Sunlite Refined Sunflower Oil 1L', '8906007280018', 145.00, 35, 10, 5, true),
  (20, 'Tata Salt Vacuum Evaporated Iodised 1kg', '8901030401014', 28.00, 100, 20, 5, true),
  (21, 'Fortune Premium Kachi Ghani Mustard Oil 1L', '8906007280025', 160.00, 0, 10, 5, true), -- Out of Stock!
  -- Personal Care & Hygiene (Category 6)
  (22, 'Dettol Original Germ Protection Bathing Soap (125g x 3)', '8901396112015', 175.00, 40, 10, 6, true),
  (23, 'Colgate MaxFresh Peppermint Ice Toothpaste 150g', '8901314010515', 115.00, 50, 12, 6, true),
  -- Household & Cleaning (Category 7)
  (24, 'Surf Excel Easy Wash Detergent Powder 1kg', '8901030366627', 140.00, 30, 8, 7, true),
  (25, 'Vim Lemon Dishwash Gel 750ml Bottle', '8901030704450', 165.00, 28, 10, 7, true)
ON CONFLICT (id) DO NOTHING;

-- 5. PAST PURCHASES & SALES TRANSACTIONS
INSERT INTO purchases (id, customer_id, cashier_id, subtotal, discount, total_amount, points_earned, points_redeemed, created_at) VALUES
  -- Purchase 1: Rahul Sharma
  (1, 1, 3, 1165.00, 50.00, 1115.00, 11, 50, '2026-10-10 11:24:00'),
  -- Purchase 2: Amitabh Verma
  (2, 3, 3, 2450.00, 0.00, 2450.00, 24, 0, '2026-10-11 14:05:00'),
  -- Purchase 3: Priya Patel
  (3, 2, 4, 825.00, 20.00, 805.00, 8, 20, '2026-10-12 16:30:00'),
  -- Purchase 4: Walk-in customer (no customer_id)
  (4, NULL, 3, 310.00, 0.00, 310.00, 0, 0, '2026-10-13 10:15:00'),
  -- Purchase 5: Sneha Kulkarni
  (5, 4, 4, 1370.00, 0.00, 1370.00, 13, 0, '2026-10-14 18:45:00'),
  -- Purchase 6: Rahul Sharma (second visit)
  (6, 1, 3, 895.00, 0.00, 895.00, 8, 0, '2026-10-15 14:10:00'),
  -- Purchase 7: Amitabh Verma (high-value visit)
  (7, 3, 4, 3820.00, 100.00, 3720.00, 37, 100, '2026-10-18 16:00:00')
ON CONFLICT (id) DO NOTHING;

-- 6. PURCHASE ITEMS (LINE ITEMS)
INSERT INTO purchase_items (id, purchase_id, product_id, quantity, unit_price, line_total) VALUES
  -- Items for Purchase 1
  (1, 1, 17, 1, 485.00, 485.00), -- Basmati Rice
  (2, 1, 18, 1, 265.00, 265.00), -- Atta
  (3, 1, 2, 1, 275.00, 275.00),  -- Butter
  (4, 1, 1, 2, 70.00, 140.00),   -- Milk x 2
  -- Items for Purchase 2
  (5, 2, 13, 2, 320.00, 640.00), -- Tata Tea x 2
  (6, 2, 14, 2, 345.00, 690.00), -- Nescafe x 2
  (7, 2, 17, 1, 485.00, 485.00), -- Basmati Rice
  (8, 2, 24, 2, 140.00, 280.00), -- Surf Excel x 2
  (9, 2, 19, 2, 145.00, 290.00), -- Sunflower Oil x 2
  (10, 2, 3, 1, 65.00, 65.00),   -- Brown Eggs
  -- Items for Purchase 3
  (11, 3, 2, 1, 275.00, 275.00), -- Butter
  (12, 3, 10, 2, 110.00, 220.00), -- Parle-G x 2
  (13, 3, 23, 1, 115.00, 115.00), -- Toothpaste
  (14, 3, 22, 1, 175.00, 175.00), -- Dettol Soap
  (15, 3, 15, 1, 40.00, 40.00),   -- Coke
  -- Items for Purchase 4 (Walk-in)
  (16, 4, 9, 2, 45.00, 90.00),   -- Bread x 2
  (17, 4, 1, 2, 72.00, 144.00),  -- Milk x 2
  (18, 4, 12, 2, 20.00, 40.00),  -- Lays x 2
  (19, 4, 8, 1, 32.00, 32.00),   -- Potato
  (20, 4, 20, 1, 4.00, 4.00),
  -- Items for Purchase 5
  (21, 5, 17, 1, 485.00, 485.00),
  (22, 5, 18, 1, 265.00, 265.00),
  (23, 5, 24, 2, 140.00, 280.00),
  (24, 5, 25, 2, 165.00, 330.00),
  (25, 5, 10, 1, 10.00, 10.00),
  -- Items for Purchase 6
  (26, 6, 6, 2, 180.00, 360.00), -- Apples x 2
  (27, 6, 13, 1, 320.00, 320.00), -- Tea
  (28, 6, 11, 1, 115.00, 115.00), -- Aloo Bhujia
  (29, 6, 4, 1, 95.00, 95.00),   -- Paneer
  (30, 6, 5, 1, 5.00, 5.00),
  -- Items for Purchase 7
  (31, 7, 17, 3, 485.00, 1455.00), -- Basmati Rice x 3
  (32, 7, 18, 2, 265.00, 530.00),  -- Atta x 2
  (33, 7, 19, 4, 145.00, 580.00),  -- Sunflower Oil x 4
  (34, 7, 14, 2, 345.00, 690.00),  -- Coffee x 2
  (35, 7, 2, 2, 275.00, 550.00),   -- Butter x 2
  (36, 7, 15, 1, 15.00, 15.00)
ON CONFLICT (id) DO NOTHING;

-- 7. SYNCHRONIZE POSTGRESQL SEQUENCES
-- Prevents primary key collisions when creating new records via REST API
SELECT setval(pg_get_serial_sequence('staff', 'id'), COALESCE((SELECT MAX(id) FROM staff), 1) + 1, false);
SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1) + 1, false);
SELECT setval(pg_get_serial_sequence('customers', 'id'), COALESCE((SELECT MAX(id) FROM customers), 1) + 1, false);
SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1) + 1, false);
SELECT setval(pg_get_serial_sequence('purchases', 'id'), COALESCE((SELECT MAX(id) FROM purchases), 1) + 1, false);
SELECT setval(pg_get_serial_sequence('purchase_items', 'id'), COALESCE((SELECT MAX(id) FROM purchase_items), 1) + 1, false);
