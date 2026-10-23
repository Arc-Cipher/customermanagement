# SuperMart POS — Supermarket Customer Management Frontend

Production-ready modern React + TypeScript frontend for the SuperMart Supermarket Customer Management & Point of Sale (POS) system.

---

## 🚀 Tech Stack

- **Framework**: React 18 with TypeScript (Strict mode enabled, no `any`)
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS v3
- **Routing**: React Router v6
- **State & Server Cache**: TanStack React Query v5
- **HTTP Client**: Axios with interceptors
- **Forms & Validation**: React Hook Form + Zod
- **Icons**: Lucide React
- **Currency Formatting**: Indian Rupee (`Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`)

---

## 📦 Features

### 1. Point of Sale & Billing (`/billing`)
- **Customer Lookup**: Fast search by 10-digit mobile phone.
- **Loyalty Members**: Displays available points, estimated points to earn, and enables 1:1 point redemption discount.
- **Instant Registration**: Inline mini-form to register new customers on the spot if phone is not found (404).
- **Walk-in Support**: Immediate toggle for customers without loyalty registration.
- **Product Search & Barcode Scan**: Real-time debounced catalog search. Pressing Enter with exact barcode match instantly adds item to cart.
- **Cart Management**: Quantity increment/decrement, remove item, live inventory stock alerts.
- **Printable Receipts**: Professional invoice modal with `@media print` styling, invoice ID, cashier name, customer info, points earned/redeemed, and full line item details.

### 2. Customer Directory (`/customers` & `/customers/:id`)
- Paginated customer table with debounced search and active/inactive status filters.
- Add customer modal with Indian mobile number regex validation (`^[6-9][0-9]{9}$`).
- Role-based edits: Managers and Admins can edit details and activate/deactivate accounts with confirmation dialogs.
- Detailed customer profile with complete lifetime purchase history and receipt reprint modal.

### 3. Inventory & Category Management (`/products`)
- Tabbed interface for Products and Categories.
- Paginated product catalog with category filter, search, and low-stock highlights.
- Stock adjustment modal with delta previews (+ to restock, - for wastage) preventing negative inventory.
- Category management with inline editing and deletion confirmation.

### 4. Analytics & Reports (`/reports`)
- Top customers by total spend with customizable limits (Top 5, 10, 20).
- Best selling products by units sold.
- Low-stock warning table with quick restock buttons.

### 5. Staff Administration (`/staff`)
- Admin-only view to create cashier, manager, and admin accounts.
- Toggle activation status with safety locks preventing self-deactivation.

---

## 🔐 Role-Based Access Control (RBAC)

| Role | Billing & POS | Read Customers/Products | Edit/Deactivate Customers | Manage Inventory & Categories | View Reports | Staff Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **CASHIER** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **MANAGER** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- Backend running at `http://localhost:8080`

### Installation
```bash
cd frontend
npm install
```

### Development Server
```bash
npm run dev
```
The application will start at `http://localhost:5173`. API requests to `/api` are automatically proxied to `http://localhost:8080`.

### Production Build
```bash
npm run build
```
Builds the app into `dist/` with full TypeScript strict checking.
