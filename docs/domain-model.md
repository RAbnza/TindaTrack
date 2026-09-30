# TindaTrack Domain Model

## Entity List

1. User
2. Product
3. Supplier
4. StockReceipt
5. StockReceiptItem
6. Sale
7. SaleItem
8. StockAdjustment
9. StockMovement
10. AuditLog

---

# 1. User

## Purpose

Represents a person who can access TindaTrack.

A User is either an **Owner** or **Staff** member and may perform business operations such as recording sales, receiving stock, or making authorized stock adjustments.

## Attributes

- `id` — unique identifier
- `name` — user's full name
- `email` — unique email used for authentication
- `password_hash` — securely hashed password
- `role` — user's authorization role, such as `OWNER` or `STAFF`
- `active` — determines whether the account can access the system
- `created_at` — date and time the account was created

## Relationships

- A User can record many Sales.
- A User can receive many StockReceipts.
- A User can perform many StockAdjustments.
- A User can be associated with many StockMovements.
- A User can generate many AuditLogs.

## Business Rules

- Email must be unique.
- Passwords must never be stored as plain text.
- Only active users may authenticate.
- Roles determine what actions a User may perform.
- Staff cannot manage user roles.
- Authorization must be enforced by the API, not only by the frontend.
- Important actions must remain attributable to the User who performed them.

---

# 2. Product

## Purpose

Represents an item sold and tracked by the store.

Products participate in sales, stock receipts, stock adjustments, and inventory movements.

## Attributes

- `id` — unique identifier
- `sku` — unique stock keeping unit
- `name` — product name
- `category` — product category
- `selling_price` — current selling price
- `reorder_level` — quantity threshold used for low-stock detection
- `active` — determines whether the Product can currently be used in transactions
- `created_at` — date and time the Product was created

## Relationships

- A Product can appear in many SaleItems.
- A Product can appear in many StockReceiptItems.
- A Product can have many StockAdjustments.
- A Product can have many StockMovements.

## Business Rules

- SKU must be unique.
- Selling price must be positive.
- `reorder_level` must be greater than or equal to zero.
- Products with transaction history must not be permanently deleted.
- Products that are no longer sold should be deactivated.
- Inventory must not be changed by directly editing the Product.
- Current stock must be reconstructable from StockMovement records.
- `current_stock` is the sum of all StockMovement `quantity_delta` values for the Product.
- A Product is considered **low stock** when:

```text
current_stock <= reorder_level
```

---

# 3. Supplier

## Purpose

Represents a person or organization that supplies products to the store.

## Attributes

- `id` — unique identifier
- `name` — supplier name
- `contact_details` — supplier contact information
- `active` — determines whether the Supplier can be selected for new receipts

## Relationships

- A Supplier can have many StockReceipts.
- Each StockReceipt belongs to one Supplier.

## Business Rules

- Historical Suppliers must remain available when referenced by existing receipts.
- Suppliers that are no longer used should normally be deactivated instead of deleted.
- Only active Suppliers should normally be selectable when recording new StockReceipts.

---

# 4. StockReceipt

## Purpose

Represents a stock delivery received from a Supplier.

The StockReceipt explains **why inventory increased**.

The resulting StockMovement records provide the inventory ledger evidence that the increase actually occurred.

## Attributes

- `id` — unique identifier
- `supplier_id` — Supplier that provided the stock
- `reference_no` — supplier invoice, delivery, or receiving reference
- `received_by` — User who recorded the receipt
- `received_at` — date and time the stock was received

## Relationships

- A StockReceipt belongs to one Supplier.
- A StockReceipt is recorded by one User.
- A StockReceipt contains one or more StockReceiptItems.
- A StockReceipt causes one or more StockMovements.

## Business Rules

- A StockReceipt must contain at least one item.
- The Supplier must exist.
- The receiving User must be recorded.
- Receiving stock must increase inventory through StockMovement records.
- The StockReceipt, StockReceiptItems, and StockMovements must be created consistently.
- A partially completed receipt must not leave inventory in an inconsistent state.
- The same Product must not appear more than once within a single StockReceipt.
- Duplicate Product entries in a StockReceipt request must be rejected rather than automatically combined.

---

# 5. StockReceiptItem

## Purpose

Represents one Product line within a StockReceipt.

It records what Product was received, how many units were received, and the cost at the time of receipt.

## Attributes

- `id` — unique identifier
- `receipt_id` — parent StockReceipt
- `product_id` — received Product
- `quantity` — number of units received
- `unit_cost` — supplier cost per unit

## Relationships

- A StockReceiptItem belongs to one StockReceipt.
- A StockReceiptItem references one Product.

## Business Rules

- Quantity must be greater than zero.
- Unit cost must not be negative.
- Money values must use an appropriate decimal representation.
- The referenced Product must exist.
- A Product may appear only once within a particular StockReceipt.
- The database should enforce uniqueness of the pair:

```text
(receipt_id, product_id)
```

- Each StockReceiptItem should produce one corresponding positive StockMovement.

---

# 6. Sale

## Purpose

Represents one completed store sales transaction.

The Sale explains **why inventory decreased**.

The corresponding StockMovement records provide the inventory ledger evidence of those decreases.

## Attributes

- `id` — unique identifier
- `recorded_by` — User who processed the Sale
- `total_amount` — server-calculated Sale total
- `payment_method` — payment type such as `CASH`, `GCASH`, or `MAYA`
- `created_at` — date and time the Sale occurred

## Relationships

- A Sale is recorded by one User.
- A Sale contains one or more SaleItems.
- A Sale causes one or more StockMovements.

## Business Rules

- A Sale must contain at least one SaleItem.
- The server must calculate the final total.
- Client-provided totals must never be trusted.
- Stock must be verified before completing the transaction.
- A Sale cannot reduce stock below zero.
- The Sale, SaleItems, and StockMovements must be created inside one database transaction.
- If any Product has insufficient stock, the entire transaction must roll back.
- The same Product must not appear more than once within one Sale.
- Duplicate Product entries in a Sale request must be rejected rather than automatically combined.
- Payment methods are recorded only; TindaTrack does not process electronic payments during the MVP.

---

# 7. SaleItem

## Purpose

Represents one Product line within a Sale.

It preserves the Product, quantity, and selling price used at the time of the transaction.

## Attributes

- `id` — unique identifier
- `sale_id` — parent Sale
- `product_id` — Product being sold
- `quantity` — quantity sold
- `unit_price` — selling price used during the transaction
- `line_total` — quantity multiplied by unit price

## Relationships

- A SaleItem belongs to one Sale.
- A SaleItem references one Product.

## Business Rules

- Quantity must be greater than zero.
- Unit price must be positive.
- `line_total` must be calculated by the server.
- The server must verify available stock.
- The Sale-time price must be stored so historical transactions do not change when Product prices change later.
- A Product may appear only once within a particular Sale.
- The database should enforce uniqueness of the pair:

```text
(sale_id, product_id)
```

- Each SaleItem should result in one corresponding negative StockMovement.
- SaleItems must not survive if the parent Sale transaction fails.

---

# 8. StockAdjustment

## Purpose

Represents an intentional manual correction to inventory.

A StockAdjustment explains **why inventory was manually increased or decreased**.

Examples include damaged goods, expired products, inventory counting corrections, missing products, or other authorized corrections.

## Attributes

- `id` — unique identifier
- `product_id` — Product being adjusted
- `quantity_delta` — amount by which inventory changes
- `reason` — required explanation for the adjustment
- `adjusted_by` — User who performed the adjustment
- `created_at` — date and time the adjustment occurred

## Relationships

- A StockAdjustment belongs to one Product.
- A StockAdjustment is performed by one User.
- A StockAdjustment causes exactly one StockMovement.

## Business Rules

- Every StockAdjustment must identify one Product.
- `quantity_delta` must not be zero.
- Positive quantities increase inventory.
- Negative quantities decrease inventory.
- Every StockAdjustment must include a reason.
- Every StockAdjustment must identify the User responsible for it.
- An adjustment that decreases inventory must not result in negative stock.
- Users must never correct inventory by directly editing Product stock.
- The StockAdjustment and its StockMovement must be created in the same database transaction.
- Every StockAdjustment must have exactly one corresponding StockMovement.
- Completed StockAdjustments should remain available as historical evidence rather than being silently edited or deleted.

---

# 9. StockMovement

## Purpose

Represents the authoritative inventory ledger.

StockMovement records **what happened to inventory**, while Sale, StockReceipt, and StockAdjustment explain **why it happened**.

## Attributes

- `id` — unique identifier
- `product_id` — Product whose inventory changed
- `type` — type of inventory movement
- `quantity_delta` — positive or negative inventory change
- `sale_id` — nullable foreign key to the Sale that caused the movement
- `stock_receipt_id` — nullable foreign key to the StockReceipt that caused the movement
- `stock_adjustment_id` — nullable foreign key to the StockAdjustment that caused the movement
- `actor_id` — User responsible for the operation
- `created_at` — date and time the movement occurred

Possible movement types include:

- `RECEIPT`
- `SALE`
- `ADJUSTMENT_IN`
- `ADJUSTMENT_OUT`

## Relationships

- A StockMovement belongs to one Product.
- A StockMovement is associated with one User.
- A StockMovement belongs to exactly one source transaction:
  - Sale, or
  - StockReceipt, or
  - StockAdjustment.

## Business Rules

- Every inventory change must create a StockMovement.
- Inventory must never change silently.
- Receipt movements must have positive `quantity_delta`.
- Sale movements must have negative `quantity_delta`.
- Adjustment movements may be positive or negative.
- Every StockMovement must identify the affected Product.
- Every StockMovement must identify the User responsible for the operation.
- Every StockMovement must reference **exactly one** source transaction.
- Of the following fields:

```text
sale_id
stock_receipt_id
stock_adjustment_id
```

exactly one must be non-null for every StockMovement.

Valid example:

```text
sale_id             = 42
stock_receipt_id    = null
stock_adjustment_id = null
```

Invalid example:

```text
sale_id             = null
stock_receipt_id    = null
stock_adjustment_id = null
```

Also invalid:

```text
sale_id             = 42
stock_receipt_id    = 15
stock_adjustment_id = null
```

- `stock_adjustment_id` must be unique so that one StockAdjustment cannot be referenced by multiple StockMovement rows.
- StockMovement history should be treated as immutable ledger evidence.
- Current inventory can be reconstructed by summing the Product's movement quantities.

```text
current_stock =
SUM(stock_movements.quantity_delta)
```

---

# 10. AuditLog

## Purpose

Records important system actions for accountability and traceability.

StockMovement answers:

> What happened to inventory?

AuditLog answers:

> Who performed an important system action, and what did they do?

## Attributes

- `id` — unique identifier
- `actor_id` — User who performed the action
- `action` — operation that occurred
- `entity_type` — type of entity affected
- `entity_id` — identifier of the affected entity
- `metadata` — additional structured information about the action
- `created_at` — date and time the action occurred

## Relationships

- An AuditLog belongs to one User as its actor.
- An AuditLog may logically reference another domain entity using `entity_type` and `entity_id`.

## Business Rules

- Important administrative and inventory actions should create AuditLog records.
- AuditLogs must identify the responsible User.
- AuditLogs should identify the affected entity when applicable.
- AuditLogs should not normally be editable or deletable by application users.
- Sensitive values such as passwords, access tokens, or authentication secrets must never be stored in metadata.

---

# Confirmed Modeling Decisions

The following questions are now resolved:

1. A Product is considered low stock when:

```text
current_stock <= reorder_level
```

and:

```text
reorder_level >= 0
```

2. Duplicate Products within the same Sale are rejected.

3. Duplicate Products within the same StockReceipt are rejected.

4. StockMovement no longer uses polymorphic:

```text
reference_type
reference_id
```

Instead it uses explicit nullable foreign keys:

```text
sale_id
stock_receipt_id
stock_adjustment_id
```

5. Every StockMovement must have exactly one source relationship.

6. `StockMovement.stock_adjustment_id` must be unique to enforce the true:

```text
StockAdjustment 1 ───── 1 StockMovement
```

relationship at the database level.