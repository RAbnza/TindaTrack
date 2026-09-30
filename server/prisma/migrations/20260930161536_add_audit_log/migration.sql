-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- AddCheckConstraint
ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_entity_reference_complete"
CHECK (
    (
        "entity_type" IS NULL
        AND "entity_id" IS NULL
    )
    OR
    (
        "entity_type" IS NOT NULL
        AND "entity_id" IS NOT NULL
    )
);

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx"
ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_actor_id_fkey"
FOREIGN KEY ("actor_id")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;