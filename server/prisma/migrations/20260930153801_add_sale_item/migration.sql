-- CreateTable
CREATE TABLE "sale_items" (
    "id" SERIAL NOT NULL,
    "sale_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- AddCheckConstraint
ALTER TABLE "sale_items"
ADD CONSTRAINT "sale_items_quantity_positive"
CHECK ("quantity" > 0);

-- AddCheckConstraint
ALTER TABLE "sale_items"
ADD CONSTRAINT "sale_items_unit_price_positive"
CHECK ("unit_price" > 0);

-- AddCheckConstraint
ALTER TABLE "sale_items"
ADD CONSTRAINT "sale_items_line_total_positive"
CHECK ("line_total" > 0);

-- AddCheckConstraint
ALTER TABLE "sale_items"
ADD CONSTRAINT "sale_items_line_total_matches_quantity_unit_price"
CHECK ("line_total" = "quantity" * "unit_price");

-- CreateIndex
CREATE UNIQUE INDEX "sale_items_sale_id_product_id_key"
ON "sale_items"("sale_id", "product_id");

-- AddForeignKey
ALTER TABLE "sale_items"
ADD CONSTRAINT "sale_items_sale_id_fkey"
FOREIGN KEY ("sale_id")
REFERENCES "sales"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items"
ADD CONSTRAINT "sale_items_product_id_fkey"
FOREIGN KEY ("product_id")
REFERENCES "products"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;