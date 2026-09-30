-- CreateTable
CREATE TABLE "stock_receipt_items" (
    "id" SERIAL NOT NULL,
    "receipt_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "stock_receipt_items_pkey" PRIMARY KEY ("id")
);

-- AddCheckConstraint
ALTER TABLE "stock_receipt_items"
ADD CONSTRAINT "stock_receipt_items_quantity_positive"
CHECK ("quantity" > 0);

-- AddCheckConstraint
ALTER TABLE "stock_receipt_items"
ADD CONSTRAINT "stock_receipt_items_unit_cost_nonnegative"
CHECK ("unit_cost" >= 0);

-- CreateIndex
CREATE UNIQUE INDEX "stock_receipt_items_receipt_id_product_id_key"
ON "stock_receipt_items"("receipt_id", "product_id");

-- AddForeignKey
ALTER TABLE "stock_receipt_items"
ADD CONSTRAINT "stock_receipt_items_receipt_id_fkey"
FOREIGN KEY ("receipt_id")
REFERENCES "stock_receipts"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receipt_items"
ADD CONSTRAINT "stock_receipt_items_product_id_fkey"
FOREIGN KEY ("product_id")
REFERENCES "products"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;