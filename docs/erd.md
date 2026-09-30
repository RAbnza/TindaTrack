# TindaTrack ER Model

## Relationship Summary

```text
User          1 ───── N Sale
User          1 ───── N StockReceipt
User          1 ───── N StockAdjustment
User          1 ───── N StockMovement
User          1 ───── N AuditLog

Supplier      1 ───── N StockReceipt

StockReceipt  1 ───── N StockReceiptItem
Product       1 ───── N StockReceiptItem

Sale          1 ───── N SaleItem
Product       1 ───── N SaleItem

Product       1 ───── N StockAdjustment
Product       1 ───── N StockMovement

StockReceipt  1 ───── N StockMovement
Sale          1 ───── N StockMovement
StockAdjustment 1 ─── 1 StockMovement
```

The last three represent the transaction that **caused** an inventory movement and require special consideration because the current model uses `reference_type` and `reference_id`.

---

# Relationships

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

One User can record many stock receipts.

Each StockReceipt records which User received or entered the stock.

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

One User may perform many inventory adjustments.

Each adjustment must identify exactly one User responsible for the correction.

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

Each StockMovement identifies the actor responsible for the transaction that produced the movement.

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

One User can generate many AuditLog records.

Each AuditLog identifies the User responsible for the recorded action.

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

One Supplier can have many historical receipts.

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

One StockReceipt contains one or more line items.

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

One Product can appear on many stock receipts over time.

Each StockReceiptItem represents exactly one Product.

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

One Sale contains one or more line items.

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

One Product can appear in many SaleItems across many transactions.

Each SaleItem references exactly one Product.

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

One Product may have many corrections throughout its lifetime.

Each StockAdjustment applies to exactly one Product in the current MVP model.

---

## StockAdjustment → StockMovement

### Cardinality

Conceptually:

```text
StockAdjustment 1 ───── 1 StockMovement
```

### Logical Reference

With the current polymorphic movement design:

```text
StockMovement.reference_type = "STOCK_ADJUSTMENT"
StockMovement.reference_id   = StockAdjustment.id
```

### Reference Owner

`StockMovement`

### Explanation

One StockAdjustment represents one correction to one Product.

That correction causes exactly one StockMovement containing the corresponding positive or negative inventory delta.

Because the current design uses `reference_type` and `reference_id`, `reference_id` is **not a normal SQL foreign key**.

The application is responsible for ensuring that when:

```text
reference_type = "STOCK_ADJUSTMENT"
```

the corresponding:

```text
reference_id
```

identifies an actual StockAdjustment.

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

The history of these movements forms the inventory ledger for that Product.

---

## StockReceipt → StockMovement

### Cardinality

```text
StockReceipt 1 ───── N StockMovement
```

### Logical Reference

```text
StockMovement.reference_type = "STOCK_RECEIPT"
StockMovement.reference_id   = StockReceipt.id
```

### Reference Owner

`StockMovement`

### Explanation

One StockReceipt may contain several products.

Each received product creates its own positive StockMovement.

For example:

```text
StockReceipt #1001

Coke       +10
Sprite     +15
Piattos     +8
```

would create:

```text
StockReceipt #1001
        │
        ├──── StockMovement: Coke    +10
        ├──── StockMovement: Sprite  +15
        └──── StockMovement: Piattos  +8
```

Therefore the relationship is:

```text
StockReceipt 1 ───── N StockMovement
```

---

## Sale → StockMovement

### Cardinality

```text
Sale 1 ───── N StockMovement
```

### Logical Reference

```text
StockMovement.reference_type = "SALE"
StockMovement.reference_id   = Sale.id
```

### Reference Owner

`StockMovement`

### Explanation

One Sale may contain multiple products.

Each product sold produces an inventory decrease.

For example:

```text
Sale #5001

Coke      × 2
Piattos   × 1
```

produces:

```text
Sale #5001
    │
    ├──── StockMovement: Coke     -2
    └──── StockMovement: Piattos  -1
```

Therefore:

```text
Sale 1 ───── N StockMovement
```

---

# AuditLog Relationships

## AuditLog → Domain Entities

AuditLog contains:

```text
entity_type
entity_id
```

For example:

```text
entity_type = "PRODUCT"
entity_id   = 42
```

Conceptually, AuditLog may refer to entities such as:

```text
Product
Sale
StockReceipt
StockAdjustment
Supplier
User
```

However:

```text
AuditLog.entity_id
```

cannot be a traditional SQL foreign key to several different tables simultaneously.

Therefore this is a **polymorphic logical relationship**, rather than a normal relational foreign key.

The application must validate that the referenced entity exists when necessary.

---

# Derived Many-to-Many Relationships

Some relationships in the domain are logically **N : N**, even though the database implements them using junction entities.

## Sale ↔ Product

### Cardinality

```text
Sale N ───── N Product
```

A Sale can contain many Products.

A Product can appear in many Sales.

This N:N relationship is resolved by:

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

The foreign keys are:

```text
SaleItem.sale_id    → Sale.id
SaleItem.product_id → Product.id
```

Therefore **SaleItem owns both foreign keys**.

---

## StockReceipt ↔ Product

### Cardinality

```text
StockReceipt N ───── N Product
```

A StockReceipt can contain many Products.

A Product can appear in many StockReceipts.

The N:N relationship is resolved by:

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

The foreign keys are:

```text
StockReceiptItem.receipt_id → StockReceipt.id
StockReceiptItem.product_id → Product.id
```

Therefore **StockReceiptItem owns both foreign keys**.

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
| StockReceipt → StockMovement | 1:N | StockMovement | logical `reference_id` |
| Sale → StockMovement | 1:N | StockMovement | logical `reference_id` |
| StockAdjustment → StockMovement | 1:1 | StockMovement | logical `reference_id` |

# Final Conceptual ER Structure

```text
                        User
          ┌──────────────┼───────────────┐
          │              │               │
          ▼              ▼               ▼
        Sale       StockReceipt    StockAdjustment
          │              │               │
          ▼              ▼               │
      SaleItem    StockReceiptItem       │
          │              │               │
          └──────┐   ┌───┘               │
                 ▼   ▼                    │
                Product ◄────────────────┘
                   │
                   │
                   ▼
             StockMovement
                   ▲
          ┌────────┼─────────┐
          │        │         │
        Sale   Receipt   Adjustment
          │        │         │
          └────────┴─────────┘
              causes movement
```

The key distinction is:

```text
Sale
StockReceipt
StockAdjustment
```

describe **why** inventory changed.

```text
StockMovement
```

records **the actual inventory change**.

And:

```text
SaleItem
StockReceiptItem
```

describe the individual products contained inside their parent transactions.