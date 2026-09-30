-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('CASH', 'GCASH', 'MAYA');

-- CreateTable
CREATE TABLE "sales" (
    "id" SERIAL NOT NULL,
    "recorded_by" INTEGER NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "payment_method" "payment_method" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- AddCheckConstraint
ALTER TABLE "sales"
ADD CONSTRAINT "sales_total_amount_positive"
CHECK ("total_amount" > 0);

-- AddForeignKey
ALTER TABLE "sales"
ADD CONSTRAINT "sales_recorded_by_fkey"
FOREIGN KEY ("recorded_by")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;