-- CreateEnum
CREATE TYPE "stock_movement_type" AS ENUM (
    'RECEIPT',
    'SALE',
    'ADJUSTMENT_IN',
    'ADJUSTMENT_OUT'
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "type" "stock_movement_type" NOT NULL,
    "quantity_delta" INTEGER NOT NULL,
    "sale_item_id" INTEGER,
    "stock_receipt_item_id" INTEGER,
    "stock_adjustment_id" INTEGER,
    "actor_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- AddCheckConstraint
ALTER TABLE "stock_movements"
ADD CONSTRAINT "stock_movements_quantity_delta_nonzero"
CHECK ("quantity_delta" <> 0);

-- AddCheckConstraint
ALTER TABLE "stock_movements"
ADD CONSTRAINT "stock_movements_exactly_one_source"
CHECK (
    num_nonnulls(
        "sale_item_id",
        "stock_receipt_item_id",
        "stock_adjustment_id"
    ) = 1
);

-- AddCheckConstraint
ALTER TABLE "stock_movements"
ADD CONSTRAINT "stock_movements_source_type_sign_consistent"
CHECK (
    (
        "sale_item_id" IS NOT NULL
        AND "type" = 'SALE'
        AND "quantity_delta" < 0
    )
    OR
    (
        "stock_receipt_item_id" IS NOT NULL
        AND "type" = 'RECEIPT'
        AND "quantity_delta" > 0
    )
    OR
    (
        "stock_adjustment_id" IS NOT NULL
        AND "type" = 'ADJUSTMENT_IN'
        AND "quantity_delta" > 0
    )
    OR
    (
        "stock_adjustment_id" IS NOT NULL
        AND "type" = 'ADJUSTMENT_OUT'
        AND "quantity_delta" < 0
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_sale_item_id_key"
ON "stock_movements"("sale_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_stock_receipt_item_id_key"
ON "stock_movements"("stock_receipt_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_stock_adjustment_id_key"
ON "stock_movements"("stock_adjustment_id");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_created_at_idx"
ON "stock_movements"("product_id", "created_at");

-- AddForeignKey
ALTER TABLE "stock_movements"
ADD CONSTRAINT "stock_movements_product_id_fkey"
FOREIGN KEY ("product_id")
REFERENCES "products"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements"
ADD CONSTRAINT "stock_movements_actor_id_fkey"
FOREIGN KEY ("actor_id")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements"
ADD CONSTRAINT "stock_movements_sale_item_id_fkey"
FOREIGN KEY ("sale_item_id")
REFERENCES "sale_items"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements"
ADD CONSTRAINT "stock_movements_stock_receipt_item_id_fkey"
FOREIGN KEY ("stock_receipt_item_id")
REFERENCES "stock_receipt_items"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements"
ADD CONSTRAINT "stock_movements_stock_adjustment_id_fkey"
FOREIGN KEY ("stock_adjustment_id")
REFERENCES "stock_adjustments"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;