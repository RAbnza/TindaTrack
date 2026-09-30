# TindaTrack ER Model

## Relationship Summary

```text
User              1 ───── N Sale
User              1 ───── N StockReceipt
User              1 ───── N StockAdjustment
User              1 ───── N StockMovement
User              1 ───── N AuditLog

Supplier          1 ───── N StockReceipt

StockReceipt      1 ───── N StockReceiptItem
Product           1 ───── N StockReceiptItem

Sale              1 ───── N SaleItem
Product           1 ───── N SaleItem

Product           1 ───── N StockAdjustment
Product           1 ───── N StockMovement

SaleItem          1 ───── 1 StockMovement
StockReceiptItem  1 ───── 1 StockMovement
StockAdjustment   1 ───── 1 StockMovement
```

---

# User Relationships

## User → Sale

### Cardinality

```text
User 1 ───── N Sale
```

### Foreign Key

```text
Sale.recorded_by → User.id
```

### Foreign Key Owner

`Sale`

### Explanation

One User can record many Sales.

Each Sale is recorded by exactly one User.

---

## User → StockReceipt

### Cardinality

```text
User 1 ───── N StockReceipt
```

### Foreign Key

```text
StockReceipt.received_by → User.id
```

### Foreign Key Owner

`StockReceipt`

### Explanation

One User can record many StockReceipts.

Each StockReceipt is recorded by exactly one User.

---

## User → StockAdjustment

### Cardinality

```text
User 1 ───── N StockAdjustment
```

### Foreign Key

```text
StockAdjustment.adjusted_by → User.id
```

### Foreign Key Owner

`StockAdjustment`

### Explanation

One User may perform many StockAdjustments.

Each StockAdjustment identifies exactly one User responsible for the correction.

---

## User → StockMovement

### Cardinality

```text
User 1 ───── N StockMovement
```

### Foreign Key

```text
StockMovement.actor_id → User.id
```

### Foreign Key Owner

`StockMovement`

### Explanation

One User may be responsible for many inventory movements.

Each StockMovement records exactly one responsible actor.

---

## User → AuditLog

### Cardinality

```text
User 1 ───── N AuditLog
```

### Foreign Key

```text
AuditLog.actor_id → User.id
```

### Foreign Key Owner

`AuditLog`

### Explanation

One User may generate many AuditLog records.

Each AuditLog belongs to exactly one actor.

---

# Supplier Relationships

## Supplier → StockReceipt

### Cardinality

```text
Supplier 1 ───── N StockReceipt
```

### Foreign Key

```text
StockReceipt.supplier_id → Supplier.id
```

### Foreign Key Owner

`StockReceipt`

### Explanation

One Supplier can have many historical StockReceipts.

Each StockReceipt belongs to exactly one Supplier.

---

# StockReceipt Relationships

## StockReceipt → StockReceiptItem

### Cardinality

```text
StockReceipt 1 ───── N StockReceiptItem
```

### Foreign Key

```text
StockReceiptItem.receipt_id → StockReceipt.id
```

### Foreign Key Owner

`StockReceiptItem`

### Explanation

One StockReceipt contains one or more StockReceiptItems.

Each StockReceiptItem belongs to exactly one StockReceipt.

---

## Product → StockReceiptItem

### Cardinality

```text
Product 1 ───── N StockReceiptItem
```

### Foreign Key

```text
StockReceiptItem.product_id → Product.id
```

### Foreign Key Owner

`StockReceiptItem`

### Explanation

One Product can appear in many StockReceiptItems over time.

Each StockReceiptItem refers to exactly one Product.

The following combination must be unique:

```text
(receipt_id, product_id)
```

This prevents the same Product from appearing twice inside one StockReceipt.

---

# Sale Relationships

## Sale → SaleItem

### Cardinality

```text
Sale 1 ───── N SaleItem
```

### Foreign Key

```text
SaleItem.sale_id → Sale.id
```

### Foreign Key Owner

`SaleItem`

### Explanation

One Sale contains one or more SaleItems.

Each SaleItem belongs to exactly one Sale.

---

## Product → SaleItem

### Cardinality

```text
Product 1 ───── N SaleItem
```

### Foreign Key

```text
SaleItem.product_id → Product.id
```

### Foreign Key Owner

`SaleItem`

### Explanation

One Product can appear in many SaleItems across historical Sales.

Each SaleItem references exactly one Product.

The following combination must be unique:

```text
(sale_id, product_id)
```

This prevents the same Product from appearing twice inside one Sale.

---

# StockAdjustment Relationships

## Product → StockAdjustment

### Cardinality

```text
Product 1 ───── N StockAdjustment
```

### Foreign Key

```text
StockAdjustment.product_id → Product.id
```

### Foreign Key Owner

`StockAdjustment`

### Explanation

One Product may have many StockAdjustments over time.

Each StockAdjustment affects exactly one Product.

---

# StockMovement Relationships

## Product → StockMovement

### Cardinality

```text
Product 1 ───── N StockMovement
```

### Foreign Key

```text
StockMovement.product_id → Product.id
```

### Foreign Key Owner

`StockMovement`

### Explanation

One Product can accumulate many StockMovements throughout its lifetime.

Each StockMovement affects exactly one Product.

The collection of these movements forms that Product's inventory ledger.

---

## SaleItem → StockMovement

### Cardinality

```text
SaleItem 1 ───── 1 StockMovement
```

### Foreign Key

```text
StockMovement.sale_item_id → SaleItem.id
```

### Foreign Key Owner

`StockMovement`

### Constraint

```text
StockMovement.sale_item_id UNIQUE
```

when non-null.

### Explanation

Each SaleItem represents the sale of exactly one Product and produces exactly one corresponding negative StockMovement.

For example:

```text
Sale #5001
│
├── SaleItem: Coke × 2
│       │
│       └── StockMovement: Coke -2
│
└── SaleItem: Piattos × 1
        │
        └── StockMovement: Piattos -1
```

Pointing the movement to `SaleItem` rather than directly to `Sale` gives the ledger an exact explanation for which transaction line caused the inventory decrease.

The unique constraint prevents several StockMovements from referencing the same SaleItem.

---

## StockReceiptItem → StockMovement

### Cardinality

```text
StockReceiptItem 1 ───── 1 StockMovement
```

### Foreign Key

```text
StockMovement.stock_receipt_item_id
    → StockReceiptItem.id
```

### Foreign Key Owner

`StockMovement`

### Constraint

```text
StockMovement.stock_receipt_item_id UNIQUE
```

when non-null.

### Explanation

Each StockReceiptItem represents the receipt of exactly one Product and produces exactly one corresponding positive StockMovement.

For example:

```text
StockReceipt #1001
│
├── StockReceiptItem: Coke +10
│       │
│       └── StockMovement: Coke +10
│
└── StockReceiptItem: Piattos +8
        │
        └── StockMovement: Piattos +8
```

The ledger therefore points directly to the specific receipt line responsible for the inventory increase.

---

## StockAdjustment → StockMovement

### Cardinality

```text
StockAdjustment 1 ───── 1 StockMovement
```

### Foreign Key

```text
StockMovement.stock_adjustment_id
    → StockAdjustment.id
```

### Foreign Key Owner

`StockMovement`

### Constraint

```text
StockMovement.stock_adjustment_id UNIQUE
```

when non-null.

### Explanation

Each StockAdjustment applies to one Product and produces exactly one corresponding StockMovement.

The unique constraint prevents multiple StockMovement records from pointing to the same StockAdjustment.

---

# StockMovement Source Constraint

StockMovement contains three nullable source foreign keys:

```text
sale_item_id
stock_receipt_item_id
stock_adjustment_id
```

Each field is individually nullable because a movement belongs to only one source type.

However, every StockMovement must have **exactly one source overall**.

## Valid Sale Movement

```text
sale_item_id          = 31
stock_receipt_item_id = NULL
stock_adjustment_id   = NULL
```

## Valid Receipt Movement

```text
sale_item_id          = NULL
stock_receipt_item_id = 27
stock_adjustment_id   = NULL
```

## Valid Adjustment Movement

```text
sale_item_id          = NULL
stock_receipt_item_id = NULL
stock_adjustment_id   = 8
```

## Invalid: No Source

```text
sale_item_id          = NULL
stock_receipt_item_id = NULL
stock_adjustment_id   = NULL
```

## Invalid: Multiple Sources

```text
sale_item_id          = 31
stock_receipt_item_id = 27
stock_adjustment_id   = NULL
```

The database must enforce:

> Exactly one of `sale_item_id`, `stock_receipt_item_id`, or `stock_adjustment_id` is non-null.

---

# Why the Source Relationships Are 1:1

All three source relationships are intentionally:

```text
SaleItem          1 ───── 1 StockMovement
StockReceiptItem  1 ───── 1 StockMovement
StockAdjustment   1 ───── 1 StockMovement
```

A foreign key by itself would only guarantee that each StockMovement refers to at most one source record.

For example:

```text
StockMovement.sale_item_id → SaleItem.id
```

without uniqueness could still allow:

```text
SaleItem #20
│
├── StockMovement #100
├── StockMovement #101
└── StockMovement #102
```

which would actually represent:

```text
SaleItem 1 ───── N StockMovement
```

Therefore all three source foreign keys require uniqueness:

```text
UNIQUE(sale_item_id)

UNIQUE(stock_receipt_item_id)

UNIQUE(stock_adjustment_id)
```

PostgreSQL permits multiple `NULL` values in ordinary unique constraints, so movements belonging to other source types do not conflict.

---

# Derived Parent Transaction Relationships

Sale and StockReceipt still indirectly produce multiple StockMovements.

For example:

```text
Sale
 │
 │ 1:N
 ▼
SaleItem
 │
 │ 1:1
 ▼
StockMovement
```

Therefore a Sale can still be associated with many StockMovements through its SaleItems.

Likewise:

```text
StockReceipt
 │
 │ 1:N
 ▼
StockReceiptItem
 │
 │ 1:1
 ▼
StockMovement
```

The difference is that StockMovement no longer owns a direct foreign key to the parent Sale or StockReceipt.

The specific line item is now the source.

---

# Derived Many-to-Many Relationships

## Sale ↔ Product

### Cardinality

```text
Sale N ───── N Product
```

This relationship is resolved through SaleItem:

```text
Sale
 │
 1
 │
 N
SaleItem
 N
 │
 1
 │
Product
```

### Foreign Keys

```text
SaleItem.sale_id    → Sale.id
SaleItem.product_id → Product.id
```

### Foreign Key Owner

`SaleItem`

---

## StockReceipt ↔ Product

### Cardinality

```text
StockReceipt N ───── N Product
```

This relationship is resolved through StockReceiptItem:

```text
StockReceipt
      │
      1
      │
      N
StockReceiptItem
      N
      │
      1
      │
   Product
```

### Foreign Keys

```text
StockReceiptItem.receipt_id → StockReceipt.id
StockReceiptItem.product_id → Product.id
```

### Foreign Key Owner

`StockReceiptItem`

---

# Complete Foreign-Key Ownership Summary

| Relationship | Cardinality | Foreign Key Owner | Foreign Key |
|---|---|---|---|
| User → Sale | 1:N | Sale | `recorded_by → User.id` |
| User → StockReceipt | 1:N | StockReceipt | `received_by → User.id` |
| User → StockAdjustment | 1:N | StockAdjustment | `adjusted_by → User.id` |
| User → StockMovement | 1:N | StockMovement | `actor_id → User.id` |
| User → AuditLog | 1:N | AuditLog | `actor_id → User.id` |
| Supplier → StockReceipt | 1:N | StockReceipt | `supplier_id → Supplier.id` |
| StockReceipt → StockReceiptItem | 1:N | StockReceiptItem | `receipt_id → StockReceipt.id` |
| Product → StockReceiptItem | 1:N | StockReceiptItem | `product_id → Product.id` |
| Sale → SaleItem | 1:N | SaleItem | `sale_id → Sale.id` |
| Product → SaleItem | 1:N | SaleItem | `product_id → Product.id` |
| Product → StockAdjustment | 1:N | StockAdjustment | `product_id → Product.id` |
| Product → StockMovement | 1:N | StockMovement | `product_id → Product.id` |
| SaleItem → StockMovement | 1:1 | StockMovement | `sale_item_id → SaleItem.id` |
| StockReceiptItem → StockMovement | 1:1 | StockMovement | `stock_receipt_item_id → StockReceiptItem.id` |
| StockAdjustment → StockMovement | 1:1 | StockMovement | `stock_adjustment_id → StockAdjustment.id` |

The three source foreign keys owned by StockMovement are individually nullable and individually unique.

Exactly one must be populated for every StockMovement.

---

# Final Conceptual Structure

```text
                           User
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
           Sale       StockReceipt   StockAdjustment
             │              │              │
             ▼              ▼              │
         SaleItem   StockReceiptItem       │
          │   │          │    │            │
          │   └─────┐    │    └─────┐      │
          ▼         ▼    ▼          ▼      ▼
       Product   StockMovement   Product  StockMovement
          ▲          ▲              ▲
          │          │              │
          └──────────┴──────────────┘
```

The important domain distinction is:

```text
SaleItem
StockReceiptItem
StockAdjustment
```

describe the **specific business event affecting one Product**.

```text
StockMovement
```

records the corresponding **inventory ledger effect**.

This gives TindaTrack a direct one-to-one link between every inventory-changing business line and its ledger evidence.