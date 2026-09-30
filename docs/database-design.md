# TindaTrack Database Specification

## Database-Wide Design Decisions

### IDs

TindaTrack uses **PostgreSQL auto-incrementing `INTEGER` primary keys**.

In Prisma, these are represented as:

```prisma
id Int @id @default(autoincrement())
```

The generated PostgreSQL migrations currently use:

```sql
"id" SERIAL NOT NULL
```

The important database-design decision is therefore:

```text
auto-incrementing INTEGER primary keys
```

rather than a dependency on one specific PostgreSQL identity syntax.

### Why integer IDs instead of UUIDs?

TindaTrack is:

- a single-store application;
- backed by one PostgreSQL database;
- not a distributed system;
- not generating records independently across multiple databases;
- not required to generate identifiers offline.

UUIDs therefore do not currently solve a domain problem.

Integer IDs provide:

- smaller indexes;
- simpler debugging;
- easier-to-read identifiers in logs and development;
- straightforward Prisma and TypeScript handling;
- more than enough capacity for the expected application size.

`BIGINT` is also unnecessary for the MVP. PostgreSQL `INTEGER` provides ample capacity for the expected volume of records in a local sari-sari store application.

---

# Money Representation

Stored monetary values use:

```text
NUMERIC(12,2)
```

This applies to:

```text
Product.selling_price
StockReceiptItem.unit_cost
Sale.total_amount
SaleItem.unit_price
SaleItem.line_total
```

`NUMERIC` provides exact decimal arithmetic and avoids floating-point errors associated with `REAL`, `DOUBLE PRECISION`, or careless JavaScript `number` arithmetic.

---

# Quantity Representation

The MVP tracks whole retail units only.

Therefore:

```text
INTEGER
```

is used for:

```text
Product.reorder_level
StockReceiptItem.quantity
SaleItem.quantity
StockAdjustment.quantity_delta
StockMovement.quantity_delta
```

Fractional quantities such as `0.5 kg` or `1.25 liters` are outside the MVP.

---

# Strings

TindaTrack primarily uses PostgreSQL `TEXT` for variable-length strings.

Length restrictions should exist only when they represent actual application rules rather than arbitrary `VARCHAR(255)` defaults.

---

# Enumerated Values

## User.role

```text
OWNER
STAFF
```

## Sale.payment_method

```text
CASH
GCASH
MAYA
```

## StockMovement.type

```text
RECEIPT
SALE
ADJUSTMENT_IN
ADJUSTMENT_OUT
```

---

# User

| Column | Type | Nullable | Constraints | Default |
|---|---|---:|---|---|
| `id` | INTEGER | No | Primary key, identity | Auto-generated |
| `name` | TEXT | No | Non-empty | — |
| `email` | TEXT | No | Unique | — |
| `password_hash` | TEXT | No | Non-empty | — |
| `role` | `user_role` | No | `OWNER` or `STAFF` | — |
| `active` | BOOLEAN | No | — | `TRUE` |
| `created_at` | TIMESTAMPTZ | No | — | Current timestamp |
| `updated_at` | TIMESTAMPTZ | No | — | Current timestamp |

---

# Product

| Column | Type | Nullable | Constraints | Default |
|---|---|---:|---|---|
| `id` | INTEGER | No | Primary key, identity | Auto-generated |
| `sku` | TEXT | No | Unique, non-empty | — |
| `name` | TEXT | No | Non-empty | — |
| `category` | TEXT | Yes | If present, non-empty | `NULL` |
| `selling_price` | NUMERIC(12,2) | No | Must be `> 0` | — |
| `reorder_level` | INTEGER | No | Must be `>= 0` | `0` |
| `active` | BOOLEAN | No | — | `TRUE` |
| `created_at` | TIMESTAMPTZ | No | — | Current timestamp |
| `updated_at` | TIMESTAMPTZ | No | — | Current timestamp |

## Low-Stock Rule

```text
current_stock =
SUM(StockMovement.quantity_delta)
```

A Product is low stock when:

```text
current_stock <= reorder_level
```

---

# Supplier

| Column | Type | Nullable | Constraints | Default |
|---|---|---:|---|---|
| `id` | INTEGER | No | Primary key, identity | Auto-generated |
| `name` | TEXT | No | Non-empty | — |
| `contact_details` | TEXT | Yes | — | `NULL` |
| `active` | BOOLEAN | No | — | `TRUE` |
| `created_at` | TIMESTAMPTZ | No | — | Current timestamp |
| `updated_at` | TIMESTAMPTZ | No | — | Current timestamp |

`contact_details` may legitimately be absent.

---

# StockReceipt

| Column | Type | Nullable | Constraints | Default |
|---|---|---:|---|---|
| `id` | INTEGER | No | Primary key, identity | Auto-generated |
| `supplier_id` | INTEGER | No | FK → `Supplier.id`, `ON DELETE RESTRICT` | — |
| `reference_no` | TEXT | Yes | If present, non-empty | `NULL` |
| `received_by` | INTEGER | No | FK → `User.id`, `ON DELETE RESTRICT` | — |
| `received_at` | TIMESTAMPTZ | No | — | Current timestamp |

`reference_no` may be absent because informal supplier deliveries may not include an external receipt or invoice number.

---

# StockReceiptItem

| Column | Type | Nullable | Constraints | Default |
|---|---|---:|---|---|
| `id` | INTEGER | No | Primary key, identity | Auto-generated |
| `receipt_id` | INTEGER | No | FK → `StockReceipt.id`, `ON DELETE RESTRICT` | — |
| `product_id` | INTEGER | No | FK → `Product.id`, `ON DELETE RESTRICT` | — |
| `quantity` | INTEGER | No | Must be `> 0` | — |
| `unit_cost` | NUMERIC(12,2) | No | Must be `>= 0` | — |

## Unique Constraint

```text
UNIQUE(receipt_id, product_id)
```

This prevents duplicate Products within one StockReceipt.

Each persisted StockReceiptItem must ultimately have exactly one corresponding StockMovement.

---

# Sale

| Column | Type | Nullable | Constraints | Default |
|---|---|---:|---|---|
| `id` | INTEGER | No | Primary key, identity | Auto-generated |
| `recorded_by` | INTEGER | No | FK → `User.id`, `ON DELETE RESTRICT` | — |
| `total_amount` | NUMERIC(12,2) | No | Must be `> 0` | — |
| `payment_method` | `payment_method` | No | `CASH`, `GCASH`, or `MAYA` | — |
| `created_at` | TIMESTAMPTZ | No | — | Current timestamp |

`total_amount` is server-calculated and must never be trusted from the client.

---

# SaleItem

| Column | Type | Nullable | Constraints | Default |
|---|---|---:|---|---|
| `id` | INTEGER | No | Primary key, identity | Auto-generated |
| `sale_id` | INTEGER | No | FK → `Sale.id`, `ON DELETE RESTRICT` | — |
| `product_id` | INTEGER | No | FK → `Product.id`, `ON DELETE RESTRICT` | — |
| `quantity` | INTEGER | No | Must be `> 0` | — |
| `unit_price` | NUMERIC(12,2) | No | Must be `> 0` | — |
| `line_total` | NUMERIC(12,2) | No | Must be `> 0` and equal quantity × unit price | — |

## Unique Constraint

```text
UNIQUE(sale_id, product_id)
```

Duplicate Products inside one Sale are rejected.

Each persisted SaleItem must ultimately have exactly one corresponding StockMovement.

---

# StockAdjustment

| Column | Type | Nullable | Constraints | Default |
|---|---|---:|---|---|
| `id` | INTEGER | No | Primary key, identity | Auto-generated |
| `product_id` | INTEGER | No | FK → `Product.id`, `ON DELETE RESTRICT` | — |
| `quantity_delta` | INTEGER | No | Must not equal `0` | — |
| `reason` | TEXT | No | Non-empty | — |
| `adjusted_by` | INTEGER | No | FK → `User.id`, `ON DELETE RESTRICT` | — |
| `created_at` | TIMESTAMPTZ | No | — | Current timestamp |

Each StockAdjustment creates exactly one corresponding StockMovement.

---

# StockMovement

| Column | Type | Nullable | Constraints | Default |
|---|---|---:|---|---|
| `id` | INTEGER | No | Primary key, identity | Auto-generated |
| `product_id` | INTEGER | No | FK → `Product.id`, `ON DELETE RESTRICT` | — |
| `type` | `stock_movement_type` | No | Valid movement type | — |
| `quantity_delta` | INTEGER | No | Must not equal `0` | — |
| `sale_item_id` | INTEGER | Yes | FK → `SaleItem.id`, `ON DELETE RESTRICT`, UNIQUE when non-null | `NULL` |
| `stock_receipt_item_id` | INTEGER | Yes | FK → `StockReceiptItem.id`, `ON DELETE RESTRICT`, UNIQUE when non-null | `NULL` |
| `stock_adjustment_id` | INTEGER | Yes | FK → `StockAdjustment.id`, `ON DELETE RESTRICT`, UNIQUE when non-null | `NULL` |
| `actor_id` | INTEGER | No | FK → `User.id`, `ON DELETE RESTRICT` | — |
| `created_at` | TIMESTAMPTZ | No | — | Current timestamp |

## Source Design

The former source fields:

```text
sale_id
stock_receipt_id
stock_adjustment_id
```

are replaced by:

```text
sale_item_id
stock_receipt_item_id
stock_adjustment_id
```

This means Sale and StockReceipt movements reference the exact line item that changed inventory.

---

## Source Nullability

Each source foreign key is individually nullable:

```text
sale_item_id             NULL allowed
stock_receipt_item_id    NULL allowed
stock_adjustment_id      NULL allowed
```

However, the row as a whole must have **exactly one source**.

---

## Exactly-One-Source Constraint

Exactly one of:

```text
sale_item_id
stock_receipt_item_id
stock_adjustment_id
```

must be non-null.

### Valid Sale Movement

```text
sale_item_id          = 51
stock_receipt_item_id = NULL
stock_adjustment_id   = NULL
```

### Valid Receipt Movement

```text
sale_item_id          = NULL
stock_receipt_item_id = 36
stock_adjustment_id   = NULL
```

### Valid Adjustment Movement

```text
sale_item_id          = NULL
stock_receipt_item_id = NULL
stock_adjustment_id   = 9
```

### Invalid — No Source

```text
NULL
NULL
NULL
```

### Invalid — Multiple Sources

```text
sale_item_id          = 51
stock_receipt_item_id = 36
stock_adjustment_id   = NULL
```

The database should enforce this using a CHECK constraint.

---

# 1:1 Source Constraints

Each of the three source relationships is one-to-one.

Therefore all three source foreign keys must be unique when non-null.

## SaleItem

```text
UNIQUE(sale_item_id)
```

enforces:

```text
SaleItem 1 ───── 1 StockMovement
```

## StockReceiptItem

```text
UNIQUE(stock_receipt_item_id)
```

enforces:

```text
StockReceiptItem 1 ───── 1 StockMovement
```

## StockAdjustment

```text
UNIQUE(stock_adjustment_id)
```

enforces:

```text
StockAdjustment 1 ───── 1 StockMovement
```

PostgreSQL permits multiple `NULL` values in ordinary unique constraints, which is exactly what this source model needs.

---

# Movement Type Consistency

The source, movement type, and quantity direction must agree.

## Sale

```text
sale_item_id IS NOT NULL
type = SALE
quantity_delta < 0
```

## Stock Receipt

```text
stock_receipt_item_id IS NOT NULL
type = RECEIPT
quantity_delta > 0
```

## Positive Adjustment

```text
stock_adjustment_id IS NOT NULL
type = ADJUSTMENT_IN
quantity_delta > 0
```

## Negative Adjustment

```text
stock_adjustment_id IS NOT NULL
type = ADJUSTMENT_OUT
quantity_delta < 0
```

A contradictory ledger entry such as:

```text
type = SALE
quantity_delta = +3
```

must not be accepted.

---

# AuditLog

| Column | Type | Nullable | Constraints | Default |
|---|---|---:|---|---|
| `id` | INTEGER | No | Primary key, identity | Auto-generated |
| `actor_id` | INTEGER | No | FK → `User.id`, `ON DELETE RESTRICT` | — |
| `action` | TEXT | No | Non-empty | — |
| `entity_type` | TEXT | Yes | Must accompany `entity_id` when present | `NULL` |
| `entity_id` | INTEGER | Yes | Logical entity identifier | `NULL` |
| `metadata` | JSONB | Yes | Must not contain secrets | `NULL` |
| `created_at` | TIMESTAMPTZ | No | — | Current timestamp |

`entity_type` and `entity_id` should either both exist or both be absent.

---

# Delete Behavior

Historical evidence should not disappear because a parent record is deleted.

Transaction-related foreign keys therefore use:

```text
ON DELETE RESTRICT
```

rather than `CASCADE`.

Important examples include:

```text
Sale.recorded_by                  → User.id
SaleItem.sale_id                  → Sale.id
SaleItem.product_id               → Product.id

StockReceipt.supplier_id          → Supplier.id
StockReceipt.received_by          → User.id
StockReceiptItem.receipt_id       → StockReceipt.id
StockReceiptItem.product_id       → Product.id

StockAdjustment.product_id        → Product.id
StockAdjustment.adjusted_by       → User.id

StockMovement.product_id          → Product.id
StockMovement.sale_item_id        → SaleItem.id
StockMovement.stock_receipt_item_id → StockReceiptItem.id
StockMovement.stock_adjustment_id → StockAdjustment.id
StockMovement.actor_id            → User.id

AuditLog.actor_id                 → User.id
```

Users, Products, and Suppliers with historical activity should generally be deactivated rather than physically deleted.

---

# Unique Constraints

The complete current unique-constraint set includes:

```text
User.email

Product.sku

SaleItem(sale_id, product_id)

StockReceiptItem(receipt_id, product_id)

StockMovement.sale_item_id

StockMovement.stock_receipt_item_id

StockMovement.stock_adjustment_id
```

The three StockMovement source constraints enforce true 1:1 relationships.

---

# Database Check Constraints

## Product

```text
selling_price > 0
reorder_level >= 0
```

## StockReceiptItem

```text
quantity > 0
unit_cost >= 0
```

## Sale

```text
total_amount > 0
```

## SaleItem

```text
quantity > 0
unit_price > 0
line_total > 0
line_total = quantity × unit_price
```

## StockAdjustment

```text
quantity_delta <> 0
```

## StockMovement

```text
quantity_delta <> 0
```

and:

> Exactly one of `sale_item_id`, `stock_receipt_item_id`, or `stock_adjustment_id` must be non-null.

The database should also ensure the source type, movement type, and quantity direction agree.

## AuditLog

Either:

```text
entity_type IS NULL
AND entity_id IS NULL
```

or:

```text
entity_type IS NOT NULL
AND entity_id IS NOT NULL
```

---

# Indexing Plan

Indexes must correspond to actual application access patterns.

TindaTrack should not add speculative indexes merely so the project can claim database optimization.

---

## Product SKU

Provided automatically by:

```text
UNIQUE(sku)
```

### Access Pattern

```text
look up Product by exact SKU
```

No additional SKU index is necessary.

---

# Product Search

No dedicated Product-name search index is part of the initial schema.

The previously proposed:

```text
INDEX(lower(Product.name))
```

has been removed.

Product search indexing will be revisited after the actual Product search query exists and can be measured.

Possible future strategies may include ordinary B-tree indexing, prefix-oriented queries, or PostgreSQL trigram search, but none should be selected before the access pattern is known.

---

# StockMovement by Product and Time

Suggested:

```text
INDEX(product_id, created_at DESC)
```

### Access Pattern

Supports:

```text
WHERE product_id = ?
ORDER BY created_at DESC
```

used for Product movement history.

---

# Sales by Date

Suggested:

```text
INDEX(created_at DESC)
```

on Sale.

### Access Pattern

Supports:

```text
today's sales
sales within a date range
daily sales reporting
recent sales
```

---

# SaleItems by Sale

The unique constraint:

```text
UNIQUE(sale_id, product_id)
```

already creates an index beginning with `sale_id`.

### Access Pattern

```text
load all SaleItems for one Sale
```

No separate `sale_id` index is initially necessary.

---

# StockReceiptItems by Receipt

Likewise:

```text
UNIQUE(receipt_id, product_id)
```

already creates an index beginning with `receipt_id`.

### Access Pattern

```text
load all StockReceiptItems for one StockReceipt
```

No additional receipt-only index is initially necessary.

---

# StockMovement Source Lookups

No additional source indexes are required initially because:

```text
UNIQUE(sale_item_id)

UNIQUE(stock_receipt_item_id)

UNIQUE(stock_adjustment_id)
```

already create indexes.

### Access Patterns

These support:

```text
find the StockMovement generated by a SaleItem

find the StockMovement generated by a StockReceiptItem

find the StockMovement generated by a StockAdjustment
```

---

# Audit History

Suggested:

```text
INDEX(created_at DESC)
```

### Access Pattern

Supports:

```text
show recent audit activity
```

An entity-specific composite AuditLog index should be added only if that query becomes part of the actual application workflow.

---

# Initial Index Summary

The intentional initial indexes are:

```text
User.email
    UNIQUE

Product.sku
    UNIQUE

Sale.created_at
    INDEX

SaleItem(sale_id, product_id)
    UNIQUE

StockReceiptItem(receipt_id, product_id)
    UNIQUE

StockMovement(product_id, created_at)
    INDEX

StockMovement.sale_item_id
    UNIQUE

StockMovement.stock_receipt_item_id
    UNIQUE

StockMovement.stock_adjustment_id
    UNIQUE

AuditLog.created_at
    INDEX
```

There is intentionally **no Product-name search index yet**.

---

# Enforcement Layers

TindaTrack uses three complementary enforcement layers:

1. Database
2. API validation
3. Service/transaction logic

---

# Database

## Unique Business Identifiers

```text
User.email
Product.sku
```

Enforcement:

```text
Database
+
API conflict/error handling
```

---

## Duplicate Product in Sale

```text
UNIQUE(sale_id, product_id)
```

Enforcement:

```text
Database
+
API validation
```

---

## Duplicate Product in StockReceipt

```text
UNIQUE(receipt_id, product_id)
```

Enforcement:

```text
Database
+
API validation
```

---

## Valid Numeric Values

Rules such as:

```text
selling_price > 0
reorder_level >= 0
quantity > 0
unit_cost >= 0
quantity_delta <> 0
```

Enforcement:

```text
Database
+
API validation
```

---

## StockMovement Has Exactly One Source

Exactly one of:

```text
sale_item_id
stock_receipt_item_id
stock_adjustment_id
```

must be non-null.

Enforcement:

```text
Database CHECK constraint
+
Service logic
```

---

## Every Source Can Have Only One Movement

```text
sale_item_id UNIQUE
stock_receipt_item_id UNIQUE
stock_adjustment_id UNIQUE
```

Enforcement:

```text
Database
```

The service is additionally responsible for making sure the movement is actually created.

---

## Movement Type Matches Source and Sign

Examples:

```text
SaleItem source
→ SALE
→ negative delta

StockReceiptItem source
→ RECEIPT
→ positive delta
```

Enforcement:

```text
Database CHECK constraints where practical
+
Service logic
```

---

# API Validation

The API validates request structure and rejects invalid input before transaction logic begins.

Examples include:

```text
valid email structure
non-empty name
non-empty SKU
selling_price > 0
reorder_level >= 0
quantity > 0
unit_cost >= 0
valid payment method
non-empty adjustment reason
quantity_delta != 0
```

The API also detects duplicate Product IDs within Sale and StockReceipt requests.

---

# Service / Transaction Logic

## Staff Cannot Manage Users

Enforcement:

```text
Authorization/service layer
```

---

## Sale Cannot Produce Negative Inventory

Enforcement:

```text
Service logic
+
Database transaction
```

The rule depends on current inventory state and therefore cannot be represented by a simple row CHECK.

---

## Negative Adjustment Cannot Produce Negative Inventory

Enforcement:

```text
Service logic
+
Database transaction
```

---

## Sale Total Is Server-Calculated

Enforcement:

```text
Service logic
```

The server calculates:

```text
SaleItem.line_total =
quantity × authoritative unit_price
```

and:

```text
Sale.total_amount =
SUM(SaleItem.line_total)
```

Client totals are never authoritative.

---

## Sale Price Is Server-Controlled

The server retrieves the Product's authoritative selling price rather than blindly trusting a client-supplied `unit_price`.

That value is copied into:

```text
SaleItem.unit_price
```

to preserve the historical price.

---

## Sale + SaleItems + StockMovements Are Atomic

Conceptually:

```text
BEGIN

create Sale

for each requested Product:
    create SaleItem
    create exactly one StockMovement
        linked to that SaleItem

COMMIT
```

Any failure causes:

```text
ROLLBACK
```

A SaleItem must never exist without its required movement after the transaction successfully completes.

---

## StockReceipt + StockReceiptItems + StockMovements Are Atomic

Conceptually:

```text
BEGIN

create StockReceipt

for each received Product:
    create StockReceiptItem
    create exactly one StockMovement
        linked to that StockReceiptItem

COMMIT
```

Any failure rolls back the complete receipt.

---

## StockAdjustment + StockMovement Are Atomic

Conceptually:

```text
BEGIN

create StockAdjustment
create exactly one StockMovement
    linked to that StockAdjustment

COMMIT
```

Both records succeed together or neither persists.

---

# Rule Enforcement Summary

| Rule | Database | API Validation | Service / Transaction |
|---|:---:|:---:|:---:|
| SKU unique | ✓ | Error handling | — |
| Email unique | ✓ | Error handling | — |
| Selling price > 0 | ✓ | ✓ | — |
| Reorder level >= 0 | ✓ | ✓ | — |
| Quantity > 0 | ✓ | ✓ | — |
| Unit cost >= 0 | ✓ | ✓ | — |
| Adjustment delta != 0 | ✓ | ✓ | — |
| Duplicate Product in Sale rejected | ✓ | ✓ | — |
| Duplicate Product in Receipt rejected | ✓ | ✓ | — |
| Exactly one movement source | ✓ | — | ✓ |
| SaleItem has at most one movement | ✓ | — | ✓ |
| ReceiptItem has at most one movement | ✓ | — | ✓ |
| Adjustment has at most one movement | ✓ | — | ✓ |
| Required source movement actually created | — | — | ✓ |
| Movement type matches source/sign | ✓ | — | ✓ |
| Staff cannot manage users | — | — | ✓ |
| Sale cannot create negative inventory | — | — | ✓ |
| Negative adjustment cannot create negative inventory | — | — | ✓ |
| Sale total calculated by server | — | — | ✓ |
| Client price not trusted | — | — | ✓ |
| Sale + items + movements atomic | Transaction | — | ✓ |
| Receipt + items + movements atomic | Transaction | — | ✓ |
| Adjustment + movement atomic | Transaction | — | ✓ |
| Historical records remain traceable | FK restrictions | — | ✓ |

# Guiding Principle

```text
API validation
      │
      ▼
reject bad input early
      │
      ▼
Service logic
      │
      ▼
enforce business behavior
      │
      ▼
Database
      │
      ▼
protect persisted invariants
```

The revised StockMovement model now gives every inventory ledger row a precise source:

```text
SaleItem          ──► StockMovement
StockReceiptItem  ──► StockMovement
StockAdjustment   ──► StockMovement
```

with each relationship enforced as true **1:1** and every movement required to have exactly one source.