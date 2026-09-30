# TindaTrack ER Model

## Relationship Summary

```text
User             1 ───── N Sale
User             1 ───── N StockReceipt
User             1 ───── N StockAdjustment
User             1 ───── N StockMovement
User             1 ───── N AuditLog

Supplier         1 ───── N StockReceipt

StockReceipt     1 ───── N StockReceiptItem
Product          1 ───── N StockReceiptItem

Sale             1 ───── N SaleItem
Product          1 ───── N SaleItem

Product          1 ───── N StockAdjustment
Product          1 ───── N StockMovement

Sale             1 ───── N StockMovement
StockReceipt     1 ───── N StockMovement
StockAdjustment  1 ───── 1 StockMovement
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

The combination:

```text
(receipt_id, product_id)
```

must be unique so the same Product cannot appear twice in one StockReceipt.

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

The combination:

```text
(sale_id, product_id)
```

must be unique so the same Product cannot appear twice in one Sale.

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

## StockAdjustment → StockMovement

### Cardinality

```text
StockAdjustment 1 ───── 1 StockMovement
```

### Foreign Key

```text
StockMovement.stock_adjustment_id → StockAdjustment.id
```

### Foreign Key Owner

`StockMovement`

### Constraint

```text
StockMovement.stock_adjustment_id UNIQUE
```

### Explanation

Each StockAdjustment produces exactly one StockMovement.

Each adjustment-related StockMovement belongs to exactly one StockAdjustment.

The foreign key alone establishes that each StockMovement points to at most one StockAdjustment.

However, to make the relationship truly **1 : 1**, the database must also enforce:

```text
UNIQUE(stock_adjustment_id)
```

Without this uniqueness constraint, the database could allow:

```text
StockAdjustment #12
        │
        ├── StockMovement #40
        ├── StockMovement #41
        └── StockMovement #42
```

which would actually make the relationship:

```text
StockAdjustment 1 ───── N StockMovement
```

The unique constraint prevents that.

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

One Product can accumulate many inventory movements.

Each StockMovement affects exactly one Product.

---

## Sale → StockMovement

### Cardinality

```text
Sale 1 ───── N StockMovement
```

### Foreign Key

```text
StockMovement.sale_id → Sale.id
```

### Foreign Key Owner

`StockMovement`

### Explanation

One Sale may contain multiple Products.

Each sold Product creates one corresponding negative StockMovement.

For example:

```text
Sale #5001
│
├── Coke × 2
└── Piattos × 1
```

produces:

```text
Sale #5001
│
├── StockMovement: Coke -2
└── StockMovement: Piattos -1
```

Therefore one Sale may own many StockMovements.

---

## StockReceipt → StockMovement

### Cardinality

```text
StockReceipt 1 ───── N StockMovement
```

### Foreign Key

```text
StockMovement.stock_receipt_id → StockReceipt.id
```

### Foreign Key Owner

`StockMovement`

### Explanation

One StockReceipt may contain multiple Products.

Each received Product produces one positive StockMovement.

For example:

```text
StockReceipt #1001
│
├── Coke +10
├── Sprite +15
└── Piattos +8
```

produces three StockMovement records referencing the same StockReceipt.

---

# StockMovement Source Constraint

A StockMovement has three nullable source foreign keys:

```text
sale_id
stock_receipt_id
stock_adjustment_id
```

Each StockMovement must have **exactly one** of these relationships populated.

Conceptually:

```text
                    Sale
                     │
                     │ 1:N
                     ▼
               StockMovement
                     ▲
                     │ 1:N
                     │
               StockReceipt

                     ▲
                     │ 1:1
                     │
              StockAdjustment
```

A valid Sale movement might contain:

```text
sale_id             = 10
stock_receipt_id    = null
stock_adjustment_id = null
```

A valid receipt movement might contain:

```text
sale_id             = null
stock_receipt_id    = 25
stock_adjustment_id = null
```

A valid adjustment movement might contain:

```text
sale_id             = null
stock_receipt_id    = null
stock_adjustment_id = 7
```

This must never be allowed:

```text
sale_id             = null
stock_receipt_id    = null
stock_adjustment_id = null
```

Nor should this be allowed:

```text
sale_id             = 10
stock_receipt_id    = 25
stock_adjustment_id = null
```

Therefore the database and application must enforce:

```text
exactly one source foreign key is non-null
```

---

# Derived Many-to-Many Relationships

## Sale ↔ Product

### Cardinality

```text
Sale N ───── N Product
```

The relationship is resolved through SaleItem:

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

The relationship is resolved through StockReceiptItem:

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
| Sale → StockMovement | 1:N | StockMovement | `sale_id → Sale.id` |
| StockReceipt → StockMovement | 1:N | StockMovement | `stock_receipt_id → StockReceipt.id` |
| StockAdjustment → StockMovement | 1:1 | StockMovement | `stock_adjustment_id → StockAdjustment.id` |

For the final relationship, `stock_adjustment_id` must additionally be unique.

---

# Final Conceptual Structure

```text
                            User
             ┌───────────────┼────────────────┐
             │               │                │
             ▼               ▼                ▼
           Sale        StockReceipt     StockAdjustment
             │               │                │
             ▼               ▼                │
         SaleItem     StockReceiptItem        │
             │               │                │
             └───────┐   ┌───┘                │
                     ▼   ▼                     │
                    Product                    │
                       ▲                       │
                       │                       │
                       │                       │
                 StockMovement ◄───────────────┘
                    ▲       ▲
                    │       │
                   Sale   StockReceipt
```

The key distinction remains:

```text
Sale
StockReceipt
StockAdjustment
```

describe **why inventory changed**.

```text
StockMovement
```

records **the actual inventory change**.

Unlike the earlier design, the source relationships are now ordinary relational foreign keys that PostgreSQL and Prisma can enforce directly.