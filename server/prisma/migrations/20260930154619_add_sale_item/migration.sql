-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity_delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "adjusted_by" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- AddCheckConstraint
ALTER TABLE "stock_adjustments"
ADD CONSTRAINT "stock_adjustments_quantity_delta_nonzero"
CHECK ("quantity_delta" <> 0);

-- AddForeignKey
ALTER TABLE "stock_adjustments"
ADD CONSTRAINT "stock_adjustments_product_id_fkey"
FOREIGN KEY ("product_id")
REFERENCES "products"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments"
ADD CONSTRAINT "stock_adjustments_adjusted_by_fkey"
FOREIGN KEY ("adjusted_by")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;