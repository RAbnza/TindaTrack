# Entity List

## 1. User

### Purpose
Represents a person who can access the system. Users are either an **Owner/Admin** or **Staff** member and are responsible for actions performed inside the system.

### Attributes
- `id` — unique identifier
- `name` — user's full name
- `email` — unique email used for login
- `password_hash` — securely hashed password
- `role` — user's role, such as `OWNER` or `STAFF`
- `active` — determines whether the user can still access the system
- `created_at` — date and time the user account was created

### Relationships
- A User can record many `StockReceipt` records.
- A User can record many `Sale` records.
- A User can create many `StockMovement` records.
- A User can generate many `AuditLog` records.

### Business Rules
- Email should be unique.
- Passwords must never be stored as plain text.
- Only active users should be allowed to log in.
- Staff users must not be allowed to manage user roles.
- Authorization must be enforced by the server, not only by the frontend.
- Actions that modify important business data should be attributable to a specific user.

---

## 2. Product

### Purpose
Represents an item sold by the sari-sari store and tracked by the inventory system.

### Attributes
- `id` — unique identifier
- `sku` — unique stock keeping unit
- `name` — product name
- `category` — product category
- `selling_price` — current selling price
- `reorder_level` — stock level used to determine whether the product is running low
- `active` — determines whether the product is available for current operations
- `created_at` — date and time the product was created

### Relationships
- A Product can appear in many `StockReceiptItem` records.
- A Product can appear in many `SaleItem` records.
- A Product can have many `StockMovement` records.

### Business Rules
- SKU must be unique.
- Selling price must be positive.
- A product with transaction history should not be permanently deleted.
- Products should instead be deactivated when they are no longer sold.
- Inventory should not be represented only by an editable stock field.
- Current stock should be derived from stock movements or from a cached value that remains transactionally consistent with them.
- A product should be considered low stock when its current quantity reaches the configured reorder level.

---

## 3. Supplier

### Purpose
Represents a person or business that supplies inventory to the store.

### Attributes
- `id` — unique identifier
- `name` — supplier name
- `contact_details` — supplier contact information
- `active` — determines whether the supplier is currently being used

### Relationships
- A Supplier can have many `StockReceipt` records.
- Each `StockReceipt` belongs to one Supplier.

### Business Rules
- Supplier information should remain available when historical stock receipts reference that supplier.
- Suppliers that are no longer used should normally be deactivated instead of deleted.
- Only active suppliers should normally be selectable when recording new stock receipts.

---

## 4. StockReceipt

### Purpose
Represents one stock delivery or receiving transaction from a supplier.

### Attributes
- `id` — unique identifier
- `supplier_id` — supplier that provided the stock
- `reference_no` — delivery, invoice, or receiving reference number
- `received_by` — user who recorded or received the stock
- `received_at` — date and time the stock was received

### Relationships
- Each StockReceipt belongs to one `Supplier`.
- Each StockReceipt is recorded by one `User`.
- A StockReceipt contains one or more `StockReceiptItem` records.
- A completed StockReceipt causes inventory-related `StockMovement` records to be created.

### Business Rules
- A stock receipt should contain at least one item.
- A receipt should reference a valid supplier.
- The receiving user should be recorded for traceability.
- Receiving stock should increase inventory through stock movements rather than directly overwriting the product's stock quantity.
- Receipt creation and its resulting inventory changes should remain consistent if an operation fails.

---

## 5. StockReceiptItem

### Purpose
Represents an individual product and quantity contained inside a stock receipt.

### Attributes
- `id` — unique identifier
- `receipt_id` — parent stock receipt
- `product_id` — product being received
- `quantity` — number of units received
- `unit_cost` — cost per unit when the stock was received

### Relationships
- Each StockReceiptItem belongs to one `StockReceipt`.
- Each StockReceiptItem references one `Product`.

### Business Rules
- Quantity must be greater than zero.
- Unit cost must use an appropriate money representation.
- Unit cost should not be negative.
- The referenced product must exist.
- Each receipt item should contribute a corresponding inventory increase through a stock movement.

---

## 6. Sale

### Purpose
Represents one completed store sales transaction.

### Attributes
- `id` — unique identifier
- `recorded_by` — user who processed the sale
- `total_amount` — server-calculated total of the sale
- `payment_method` — recorded payment type such as `CASH`, `GCASH`, or `MAYA`
- `created_at` — date and time the sale occurred

### Relationships
- Each Sale is recorded by one `User`.
- A Sale contains one or more `SaleItem` records.
- A completed Sale produces one or more `StockMovement` records.

### Business Rules
- A sale must contain at least one item.
- The server must calculate the final sale total.
- Client-provided totals must never be trusted.
- A sale must not reduce any product's stock below zero unless backorders are deliberately introduced later.
- The Sale, SaleItems, and resulting StockMovements must be created within one database transaction.
- If any product has insufficient stock, the complete sale must fail and roll back.
- Payment method is only recorded as information during the MVP; TindaTrack does not process GCash or Maya payments directly.

---

## 7. SaleItem

### Purpose
Represents one product line within a sale.

### Attributes
- `id` — unique identifier
- `sale_id` — parent sale
- `product_id` — product being sold
- `quantity` — quantity purchased
- `unit_price` — price used at the time of sale
- `line_total` — total for that sale item

### Relationships
- Each SaleItem belongs to one `Sale`.
- Each SaleItem references one `Product`.

### Business Rules
- Quantity must be greater than zero.
- Unit price must be positive.
- `line_total` should be calculated by the server.
- The server must verify the product's price and available stock.
- The system should preserve the item's sale-time price rather than relying only on the product's current selling price later.
- Creating a SaleItem should ultimately result in a negative stock movement for its quantity.
- SaleItems must not remain in the database when the parent sale transaction fails.

---

## 8. StockMovement

### Purpose
Provides the authoritative history of every inventory increase or decrease.

It allows the system to explain why a product's inventory changed instead of treating stock as a number that users can freely edit.

### Attributes
- `id` — unique identifier
- `product_id` — affected product
- `type` — reason/category of inventory movement
- `quantity_delta` — positive or negative inventory change
- `reference_type` — type of transaction responsible for the movement
- `reference_id` — identifier of the related transaction
- `actor_id` — user responsible for the action
- `created_at` — date and time of the movement

### Relationships
- Each StockMovement belongs to one `Product`.
- Each StockMovement is associated with one `User` through `actor_id`.
- A StockMovement may reference a `Sale`, `StockReceipt`, or stock adjustment through its reference fields.

### Business Rules
- Inventory must never be modified silently.
- Every stock increase or decrease must have a traceable movement.
- Stock receipts create positive inventory movements.
- Sales create negative inventory movements.
- Manual corrections must be recorded as adjustments rather than changing stock directly.
- Adjustments must include a reason and actor.
- A movement should remain permanently available as historical evidence.
- Sale-related stock movements must be created within the same database transaction as the sale.
- Current stock can be calculated from the sum of a product's quantity deltas.

---

## 9. AuditLog

### Purpose
Records important system actions so that changes can be traced back to the user who performed them.

### Attributes
- `id` — unique identifier
- `actor_id` — user who performed the action
- `action` — action that occurred
- `entity_type` — type of entity affected
- `entity_id` — identifier of the affected entity
- `metadata` — additional information about the action
- `created_at` — date and time the action occurred

### Relationships
- Each AuditLog is associated with the `User` that performed the action.
- An AuditLog can reference entities such as Product, User, Sale, Supplier, or StockReceipt using `entity_type` and `entity_id`.

### Business Rules
- Important administrative and inventory-related actions should be logged.
- Audit records should identify who performed the action.
- Audit records should identify what entity was affected.
- Historical audit records should not normally be editable or deletable by regular users.
- Metadata should contain useful context without storing sensitive information such as passwords or authentication tokens.

# Open Questions

1. **How should current inventory be calculated?**  
   Should every inventory query calculate current stock by summing `StockMovement.quantity_delta`, or should Product eventually have a cached `on_hand` value that is updated transactionally for faster reads?

2. **How should stock adjustments be represented?**  
   Should adjustments exist only as `StockMovement` records with an adjustment type and reason, or should there eventually be separate `StockAdjustment` and `StockAdjustmentItem` entities similar to stock receipts?

3. **What should happen when a product's selling price changes?**  
   The `Product.selling_price` can represent the current price, while `SaleItem.unit_price` preserves the historical selling price. The project should define whether staff can override the current price during a sale and, if so, who is authorized to do it.

4. **How should incorrect completed transactions be corrected?**  
   Should completed sales and stock receipts be immutable and corrected only through reversal or adjustment transactions, rather than allowing users to edit or delete historical records?

5. **How should reference numbers and transaction identifiers work?**  
   Should `StockReceipt.reference_no` be manually entered from supplier documents, automatically generated by TindaTrack, or support both? The same decision may later affect human-readable sale receipt numbers and adjustment references.