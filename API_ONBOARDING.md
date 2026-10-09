# User & Business Setup Guide

This guide explains the complete flow for setting up a business owner (admin) who manages a tenant (business) with multiple shops (outlets) in TerraPOS.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup Flow Diagram](#setup-flow-diagram)
- [Step-by-Step API Guide](#step-by-step-api-guide)
  - [Phase 1: User Registration](#phase-1-user-registration)
  - [Phase 2: Business (Tenant) Creation](#phase-2-business-tenant-creation)
  - [Phase 3: Outlet Setup](#phase-3-outlet-setup)
  - [Phase 4: Employee Setup](#phase-4-employee-setup)
  - [Phase 5: Menu Configuration](#phase-5-menu-configuration)
  - [Phase 6: Inventory Setup](#phase-6-inventory-setup)
  - [Phase 7: POS Operations](#phase-7-pos-operations)
- [Complete cURL Examples](#complete-curl-examples)
- [Role Hierarchy](#role-hierarchy)
- [Error Handling](#error-handling)

---

## Overview

TerraPOS uses a **multi-tenant architecture** where:

- **User**: A web/admin account that can manage multiple businesses
- **Tenant**: A business entity (e.g., "TerraCafe Indonesia")
- **Outlet**: A physical shop/branch under a tenant
- **Employee**: POS terminal users who login with PIN at specific outlets

```
User (Admin)
  └── Tenant (Business)
        ├── Outlet 1 (Mall Branch)
        │     └── Employees (Cashiers, Baristas)
        ├── Outlet 2 (Downtown Branch)
        │     └── Employees
        └── Shared Resources
              ├── Categories
              ├── Products
              └── Ingredients
```

---

## Architecture

### Authentication Layers

| Layer | Description | Authentication |
|-------|-------------|----------------|
| **Web Admin** | Business owners, managers | Cookie-based session (better-auth) |
| **POS Terminal** | Cashiers, baristas | PIN-based per outlet |

### Tenant Scope

All business data is scoped by `tenantId`:

- Categories, Products, Ingredients → Tenant-level (shared across outlets)
- Employees → Tenant-level (assigned to specific outlets)
- Transactions, Stock → Outlet-level

---

## Setup Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER & BUSINESS SETUP FLOW                         │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │ 1. REGISTER  │  POST /auth/sign-up/email
  │    USER      │  → Creates User + Account
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ 2. SIGN IN   │  POST /auth/sign-in/email
  │              │  → Creates Session + Cookie
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ 3. CREATE    │  POST /auth/tenants
  │    TENANT    │  → Creates Tenant + OWNER membership
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ 4. SET       │  POST /auth/tenants/active
  │    ACTIVE    │  → Updates Session.activeTenantId
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ 5. CREATE    │  POST /outlets (×N)
  │    OUTLETS   │  → Creates outlet branches
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ 6. CREATE    │  POST /employees (×N)
  │    EMPLOYEES │  → Creates POS users with PIN
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ 7. SETUP     │  POST /categories
  │    MENU      │  POST /products
  └──────┬───────┘  POST /modifier-groups
         │
         ▼
  ┌──────────────┐
  │ 8. SETUP     │  POST /ingredients
  │    INVENTORY │  POST /recipes
  └──────┬───────┘  POST /stock-movements
         │
         ▼
  ┌──────────────┐
  │ 9. START     │  POST /employees/login (POS)
  │    SELLING   │  POST /transactions
  └──────────────┘  POST /transactions/:id/payments
```

---

## Step-by-Step API Guide

### Phase 1: User Registration

#### 1.1 Create User Account

```http
POST /auth/sign-up/email
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response:**

```json
{
  "user": {
    "id": "user_uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": false,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### 1.2 Sign In

```http
POST /auth/sign-in/email
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response:**

```json
{
  "user": {
    "id": "user_uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "session": {
    "id": "session_uuid",
    "token": "session_token_here",
    "expiresAt": "2024-01-22T10:00:00Z"
  }
}
```

**Cookie Set:** `terrapos.session_token=session_token_here`

---

### Phase 2: Business (Tenant) Creation

#### 2.1 Create Tenant

```http
POST /auth/tenants
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "name": "TerraCafe Indonesia",
  "slug": "terracafe-indonesia",
  "logo": "https://cdn.example.com/logo.png",
  "metadata": {
    "industry": "F&B",
    "founded": "2024"
  }
}
```

**Response:**

```json
{
  "id": "tenant_uuid",
  "name": "TerraCafe Indonesia",
  "slug": "terracafe-indonesia",
  "code": "TEN-ABC123",
  "logo": "https://cdn.example.com/logo.png",
  "isActive": true,
  "createdAt": "2024-01-15T10:05:00Z"
}
```

> **Note:** The user automatically becomes the OWNER of this tenant.

#### 2.2 Set Active Tenant

```http
POST /auth/tenants/active
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "tenantId": "tenant_uuid"
}
```

**Response:**

```json
{
  "activeTenantId": "tenant_uuid",
  "tenant": {
    "id": "tenant_uuid",
    "name": "TerraCafe Indonesia",
    "slug": "terracafe-indonesia"
  }
}
```

> **Important:** All subsequent API calls will be scoped to this active tenant.

#### 2.3 Get User's Tenants (Optional)

```http
GET /auth/tenants
Cookie: terrapos.session_token=<session_token>
```

**Response:**

```json
[
  {
    "id": "tenant_uuid",
    "name": "TerraCafe Indonesia",
    "slug": "terracafe-indonesia",
    "role": "OWNER",
    "memberSince": "2024-01-15T10:05:00Z"
  }
]
```

---

### Phase 3: Outlet Setup

#### 3.1 Create First Outlet (Main Branch)

```http
POST /outlets
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "name": "TerraCafe - Mall Central",
  "code": "OUT-001",
  "address": "Mall Central Lt. 2, Jakarta",
  "phone": "+62-21-1234567"
}
```

**Response:**

```json
{
  "id": "outlet_1_uuid",
  "tenantId": "tenant_uuid",
  "name": "TerraCafe - Mall Central",
  "code": "OUT-001",
  "address": "Mall Central Lt. 2, Jakarta",
  "phone": "+62-21-1234567",
  "isActive": true,
  "createdAt": "2024-01-15T10:10:00Z"
}
```

#### 3.2 Create Second Outlet

```http
POST /outlets
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "name": "TerraCafe - Downtown",
  "code": "OUT-002",
  "address": "Jl. Sudirman No. 123, Jakarta",
  "phone": "+62-21-7654321"
}
```

#### 3.3 List All Outlets

```http
GET /outlets
Cookie: terrapos.session_token=<session_token>
```

**Response:**

```json
[
  {
    "id": "outlet_1_uuid",
    "name": "TerraCafe - Mall Central",
    "code": "OUT-001",
    "_count": { "employees": 0, "transactions": 0, "devices": 0 }
  },
  {
    "id": "outlet_2_uuid",
    "name": "TerraCafe - Downtown",
    "code": "OUT-002",
    "_count": { "employees": 0, "transactions": 0, "devices": 0 }
  }
]
```

---

### Phase 4: Employee Setup

#### 4.1 Create Cashier for Outlet 1

```http
POST /employees
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "employeeNo": "EMP-001",
  "name": "Sarah Cashier",
  "email": "sarah@example.com",
  "phone": "+62-812-1111111",
  "pin": "1234",
  "role": "CASHIER",
  "outletIds": ["outlet_1_uuid"]
}
```

**Response:**

```json
{
  "id": "employee_1_uuid",
  "employeeNo": "EMP-001",
  "name": "Sarah Cashier",
  "role": "CASHIER",
  "isActive": true,
  "outlets": [
    {
      "outlet": {
        "id": "outlet_1_uuid",
        "name": "TerraCafe - Mall Central",
        "code": "OUT-001"
      }
    }
  ]
}
```

#### 4.2 Create Manager (Multiple Outlets)

```http
POST /employees
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "employeeNo": "EMP-002",
  "name": "Mike Manager",
  "email": "mike@example.com",
  "pin": "9999",
  "role": "MANAGER",
  "outletIds": ["outlet_1_uuid", "outlet_2_uuid"]
}
```

#### 4.3 Create Barista

```http
POST /employees
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "employeeNo": "EMP-003",
  "name": "Lisa Barista",
  "pin": "5678",
  "role": "BARISTA",
  "outletIds": ["outlet_1_uuid"]
}
```

---

### Phase 5: Menu Configuration

#### 5.1 Create Categories

```http
POST /categories
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "name": "Hot Coffee",
  "description": "All hot coffee beverages",
  "sortOrder": 1,
  "color": "#8B4513",
  "icon": "coffee-hot"
}
```

```http
POST /categories
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "name": "Iced Coffee",
  "description": "All iced coffee beverages",
  "sortOrder": 2,
  "color": "#4169E1",
  "icon": "coffee-ice"
}
```

#### 5.2 Create Modifier Groups

```http
POST /modifier-groups
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "name": "Sugar Level",
  "description": "Sweetness options",
  "isRequired": true,
  "minSelection": 1,
  "maxSelection": 1,
  "modifiers": [
    { "name": "Normal", "priceAdjustment": 0, "isDefault": true, "sortOrder": 0 },
    { "name": "Less Sugar", "priceAdjustment": 0, "sortOrder": 1 },
    { "name": "No Sugar", "priceAdjustment": 0, "sortOrder": 2 }
  ]
}
```

```http
POST /modifier-groups
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "name": "Extra Shots",
  "isRequired": false,
  "minSelection": 0,
  "maxSelection": 3,
  "modifiers": [
    { "name": "Extra Shot", "priceAdjustment": 5000, "sortOrder": 0 },
    { "name": "Double Shot", "priceAdjustment": 10000, "sortOrder": 1 }
  ]
}
```

#### 5.3 Create Products

```http
POST /products
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "categoryId": "hot_coffee_category_uuid",
  "sku": "HOT-AMR-001",
  "name": "Americano",
  "description": "Classic espresso with hot water",
  "basePrice": 25000,
  "productType": "COMPOSED",
  "variants": [
    { "name": "Regular", "priceDelta": 0, "sortOrder": 0 },
    { "name": "Large", "priceDelta": 5000, "sortOrder": 1 }
  ],
  "modifierGroupIds": ["sugar_level_uuid", "extra_shots_uuid"]
}
```

```http
POST /products
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "categoryId": "hot_coffee_category_uuid",
  "sku": "HOT-LAT-001",
  "name": "Caffe Latte",
  "description": "Espresso with steamed milk",
  "basePrice": 30000,
  "productType": "COMPOSED",
  "variants": [
    { "name": "Hot", "priceDelta": 0 },
    { "name": "Iced", "priceDelta": 3000 }
  ],
  "modifierGroupIds": ["sugar_level_uuid", "extra_shots_uuid"]
}
```

---

### Phase 6: Inventory Setup

#### 6.1 Create Ingredients (Raw Materials)

```http
POST /ingredients
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "code": "ING-BEAN-001",
  "name": "House Blend Coffee Beans",
  "description": "Premium arabica beans",
  "unit": "gram",
  "costPerUnit": 0.25,
  "minimumStock": 1000,
  "currentStock": 5000
}
```

```http
POST /ingredients
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "code": "ING-MILK-001",
  "name": "Fresh Milk",
  "unit": "ml",
  "costPerUnit": 0.02,
  "minimumStock": 5000,
  "currentStock": 20000
}
```

```http
POST /ingredients
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "code": "ING-WATER-001",
  "name": "Mineral Water",
  "unit": "ml",
  "costPerUnit": 0.001,
  "minimumStock": 10000,
  "currentStock": 50000
}
```

```http
POST /ingredients
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "code": "ING-CUP-001",
  "name": "Paper Cup 12oz",
  "unit": "pcs",
  "costPerUnit": 500,
  "minimumStock": 200,
  "currentStock": 1000
}
```

#### 6.2 Create Recipes (Link Products to Ingredients)

**Recipe for Americano:**

```http
POST /recipes
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "productId": "americano_product_uuid",
  "items": [
    {
      "ingredientId": "coffee_beans_uuid",
      "quantity": 18,
      "unit": "gram",
      "notes": "Double shot espresso"
    },
    {
      "ingredientId": "water_uuid",
      "quantity": 200,
      "unit": "ml"
    },
    {
      "ingredientId": "paper_cup_uuid",
      "quantity": 1,
      "unit": "pcs"
    }
  ]
}
```

**Response:**

```json
{
  "productId": "americano_product_uuid",
  "productName": "Americano",
  "productSku": "HOT-AMR-001",
  "productType": "COMPOSED",
  "basePrice": 25000,
  "totalCogs": 4700,
  "profitMargin": 20300,
  "items": [
    {
      "ingredientName": "House Blend Coffee Beans",
      "quantity": 18,
      "unit": "gram",
      "costPerUnit": 0.25,
      "lineCost": 4.5
    },
    {
      "ingredientName": "Mineral Water",
      "quantity": 200,
      "unit": "ml",
      "costPerUnit": 0.001,
      "lineCost": 0.2
    },
    {
      "ingredientName": "Paper Cup 12oz",
      "quantity": 1,
      "unit": "pcs",
      "costPerUnit": 500,
      "lineCost": 500
    }
  ]
}
```

**Recipe for Caffe Latte:**

```http
POST /recipes
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "productId": "latte_product_uuid",
  "items": [
    {
      "ingredientId": "coffee_beans_uuid",
      "quantity": 18,
      "unit": "gram"
    },
    {
      "ingredientId": "milk_uuid",
      "quantity": 150,
      "unit": "ml"
    },
    {
      "ingredientId": "paper_cup_uuid",
      "quantity": 1,
      "unit": "pcs"
    }
  ]
}
```

#### 6.3 Initial Stock (Optional - if not set during ingredient creation)

```http
POST /stock-movements
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "localUuid": "stock-init-001",
  "outletId": "outlet_1_uuid",
  "ingredientId": "coffee_beans_uuid",
  "employeeId": "manager_uuid",
  "movementType": "PURCHASE",
  "quantity": 5000,
  "unit": "gram",
  "costPerUnit": 0.25,
  "notes": "Initial stock purchase"
}
```

---

### Phase 7: POS Operations

#### 7.1 Employee Login at POS Terminal

```http
POST /employees/login
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "outletId": "outlet_1_uuid",
  "employeeNo": "EMP-001",
  "pin": "1234"
}
```

**Response:**

```json
{
  "employee": {
    "id": "employee_1_uuid",
    "employeeNo": "EMP-001",
    "name": "Sarah Cashier",
    "role": "CASHIER"
  },
  "outlet": {
    "id": "outlet_1_uuid",
    "name": "TerraCafe - Mall Central",
    "code": "OUT-001"
  },
  "shiftId": "shift_uuid"
}
```

#### 7.2 Create Transaction (Order)

```http
POST /transactions
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "localUuid": "trx-local-001",
  "outletId": "outlet_1_uuid",
  "cashierId": "employee_1_uuid",
  "items": [
    {
      "productId": "americano_product_uuid",
      "variantId": "regular_variant_uuid",
      "quantity": 2,
      "modifiers": [
        { "modifierId": "less_sugar_modifier_uuid" }
      ],
      "notes": "One for here, one to go"
    },
    {
      "productId": "latte_product_uuid",
      "variantId": "iced_variant_uuid",
      "quantity": 1,
      "modifiers": [
        { "modifierId": "no_sugar_modifier_uuid" },
        { "modifierId": "extra_shot_modifier_uuid" }
      ]
    }
  ],
  "customerName": "Alice",
  "customerPhone": "+62-812-9999999"
}
```

**Response:**

```json
{
  "id": "transaction_uuid",
  "localUuid": "trx-local-001",
  "transactionNo": "TRX-20240115-0001",
  "status": "OPEN",
  "subtotal": 88000,
  "discountAmount": 0,
  "taxAmount": 9680,
  "grandTotal": 97680,
  "items": [
    {
      "productName": "Americano",
      "variantName": "Regular",
      "quantity": 2,
      "unitPrice": 25000,
      "modifiersTotal": 0,
      "subtotal": 50000
    },
    {
      "productName": "Caffe Latte",
      "variantName": "Iced",
      "quantity": 1,
      "unitPrice": 33000,
      "modifiersTotal": 5000,
      "subtotal": 38000
    }
  ],
  "totalPaid": 0,
  "remainingAmount": 97680
}
```

#### 7.3 Add Payment (Cash)

```http
POST /transactions/transaction_uuid/payments
Cookie: terrapos.session_token=<session_token>
Content-Type: application/json

{
  "paymentMethod": "CASH",
  "amount": 97680,
  "receivedAmount": 100000
}
```

**Response:**

```json
{
  "id": "transaction_uuid",
  "status": "CLOSED",
  "grandTotal": 97680,
  "totalPaid": 97680,
  "remainingAmount": 0,
  "payments": [
    {
      "paymentMethod": "CASH",
      "amount": 97680,
      "receivedAmount": 100000,
      "changeAmount": 2320
    }
  ]
}
```

> **Important:** When payment is complete and status becomes "CLOSED", the **Recipe Engine** automatically:
>
> 1. Deducts ingredients based on recipes
> 2. Creates StockMovement records (SALE type)
> 3. Updates Ingredient.currentStock

#### 7.4 End Employee Shift

```http
POST /employees/employee_1_uuid/end-shift/shift_uuid
Cookie: terrapos.session_token=<session_token>
```

---

## Complete cURL Examples

### Full Setup Script

```bash
#!/bin/bash

BASE_URL="http://localhost:8068"

# ========================================
# 1. REGISTER USER
# ========================================
echo "1. Registering user..."
curl -X POST "$BASE_URL/auth/sign-up/email" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'

# ========================================
# 2. SIGN IN
# ========================================
echo "\n2. Signing in..."
RESPONSE=$(curl -s -c cookies.txt -X POST "$BASE_URL/auth/sign-in/email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }')
echo $RESPONSE

# ========================================
# 3. CREATE TENANT
# ========================================
echo "\n3. Creating tenant..."
TENANT=$(curl -s -b cookies.txt -X POST "$BASE_URL/auth/tenants" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TerraCafe Indonesia",
    "slug": "terracafe-id"
  }')
echo $TENANT
TENANT_ID=$(echo $TENANT | jq -r '.id')

# ========================================
# 4. SET ACTIVE TENANT
# ========================================
echo "\n4. Setting active tenant..."
curl -s -b cookies.txt -X POST "$BASE_URL/auth/tenants/active" \
  -H "Content-Type: application/json" \
  -d "{\"tenantId\": \"$TENANT_ID\"}"

# ========================================
# 5. CREATE OUTLETS
# ========================================
echo "\n5. Creating outlets..."
OUTLET1=$(curl -s -b cookies.txt -X POST "$BASE_URL/outlets" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TerraCafe - Mall Central",
    "code": "OUT-001",
    "address": "Mall Central Lt. 2"
  }')
echo $OUTLET1
OUTLET1_ID=$(echo $OUTLET1 | jq -r '.id')

# ========================================
# 6. CREATE EMPLOYEE
# ========================================
echo "\n6. Creating employee..."
EMPLOYEE=$(curl -s -b cookies.txt -X POST "$BASE_URL/employees" \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeNo\": \"EMP-001\",
    \"name\": \"Sarah Cashier\",
    \"pin\": \"1234\",
    \"role\": \"CASHIER\",
    \"outletIds\": [\"$OUTLET1_ID\"]
  }")
echo $EMPLOYEE
EMPLOYEE_ID=$(echo $EMPLOYEE | jq -r '.id')

# ========================================
# 7. CREATE CATEGORY
# ========================================
echo "\n7. Creating category..."
CATEGORY=$(curl -s -b cookies.txt -X POST "$BASE_URL/categories" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hot Coffee",
    "sortOrder": 1
  }')
echo $CATEGORY
CATEGORY_ID=$(echo $CATEGORY | jq -r '.id')

# ========================================
# 8. CREATE INGREDIENT
# ========================================
echo "\n8. Creating ingredient..."
INGREDIENT=$(curl -s -b cookies.txt -X POST "$BASE_URL/ingredients" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ING-BEAN-001",
    "name": "Coffee Beans",
    "unit": "gram",
    "costPerUnit": 0.25,
    "currentStock": 5000
  }')
echo $INGREDIENT
INGREDIENT_ID=$(echo $INGREDIENT | jq -r '.id')

# ========================================
# 9. CREATE PRODUCT
# ========================================
echo "\n9. Creating product..."
PRODUCT=$(curl -s -b cookies.txt -X POST "$BASE_URL/products" \
  -H "Content-Type: application/json" \
  -d "{
    \"categoryId\": \"$CATEGORY_ID\",
    \"sku\": \"HOT-AMR-001\",
    \"name\": \"Americano\",
    \"basePrice\": 25000,
    \"productType\": \"COMPOSED\"
  }")
echo $PRODUCT
PRODUCT_ID=$(echo $PRODUCT | jq -r '.id')

# ========================================
# 10. CREATE RECIPE
# ========================================
echo "\n10. Creating recipe..."
curl -s -b cookies.txt -X POST "$BASE_URL/recipes" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"items\": [
      {
        \"ingredientId\": \"$INGREDIENT_ID\",
        \"quantity\": 18,
        \"unit\": \"gram\"
      }
    ]
  }"

# ========================================
# 11. CREATE TRANSACTION
# ========================================
echo "\n11. Creating transaction..."
TRX=$(curl -s -b cookies.txt -X POST "$BASE_URL/transactions" \
  -H "Content-Type: application/json" \
  -d "{
    \"localUuid\": \"trx-$(date +%s)\",
    \"outletId\": \"$OUTLET1_ID\",
    \"cashierId\": \"$EMPLOYEE_ID\",
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 1
      }
    ]
  }")
echo $TRX
TRX_ID=$(echo $TRX | jq -r '.id')

# ========================================
# 12. ADD PAYMENT (Complete Sale)
# ========================================
echo "\n12. Adding payment..."
curl -s -b cookies.txt -X POST "$BASE_URL/transactions/$TRX_ID/payments" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "CASH",
    "amount": 27500,
    "receivedAmount": 30000
  }'

echo "\n\n✅ Setup complete! Check ingredient stock - should be reduced by 18g"

# Verify stock reduction
echo "\n13. Checking ingredient stock..."
curl -s -b cookies.txt "$BASE_URL/ingredients/$INGREDIENT_ID"
```

---

## Role Hierarchy

### TenantMemberRole (Web Admin)

| Role | Permissions |
|------|-------------|
| **OWNER** | Full control: delete tenant, transfer ownership, manage all settings |
| **ADMIN** | Manage members, settings, all CRUD operations |
| **MEMBER** | Read-only access, basic operations |

### EmployeeRole (POS Terminal)

| Role | Permissions |
|------|-------------|
| **OWNER** | Business owner operating POS |
| **MANAGER** | Full outlet management, can void transactions |
| **SUPERVISOR** | Team lead, can void transactions |
| **CASHIER** | Process sales, handle cash |
| **BARISTA** | Prepare orders (view only) |
| **KITCHEN** | Kitchen display (view only) |

---

## Error Handling

### Common Error Responses

```json
// 400 Bad Request - Validation error
{
  "statusCode": 400,
  "message": "PIN must be 4-6 digits",
  "error": "Bad Request"
}

// 401 Unauthorized - Not authenticated
{
  "statusCode": 401,
  "message": "Session expired or invalid",
  "error": "Unauthorized"
}

// 403 Forbidden - No tenant access
{
  "statusCode": 403,
  "message": "You do not have access to this tenant",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}

// 409 Conflict - Duplicate
{
  "statusCode": 409,
  "message": "Employee with this number already exists",
  "error": "Conflict"
}
```

---

## Quick Reference: API Sequence

| Step | Endpoint | Method | Description |
|------|----------|--------|-------------|
| 1 | `/auth/sign-up/email` | POST | Register user |
| 2 | `/auth/sign-in/email` | POST | Sign in, get session |
| 3 | `/auth/tenants` | POST | Create business |
| 4 | `/auth/tenants/active` | POST | Set active tenant |
| 5 | `/outlets` | POST | Create outlets |
| 6 | `/employees` | POST | Create POS users |
| 7 | `/categories` | POST | Create categories |
| 8 | `/modifier-groups` | POST | Create modifiers |
| 9 | `/products` | POST | Create menu items |
| 10 | `/ingredients` | POST | Create raw materials |
| 11 | `/recipes` | POST | Link products to ingredients |
| 12 | `/employees/login` | POST | POS terminal login |
| 13 | `/transactions` | POST | Create order |
| 14 | `/transactions/:id/payments` | POST | Complete payment |
