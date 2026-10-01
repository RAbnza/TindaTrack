CREATE INDEX "products_active_name_id_idx" ON "products"("active", "name", "id");
CREATE INDEX "products_active_sku_id_idx" ON "products"("active", "sku", "id");
CREATE INDEX "sales_created_at_id_idx" ON "sales"("created_at", "id");
CREATE INDEX "stock_movements_created_at_id_idx" ON "stock_movements"("created_at", "id");
CREATE INDEX "stock_movements_type_created_at_id_idx" ON "stock_movements"("type", "created_at", "id");
CREATE INDEX "audit_logs_created_at_id_idx" ON "audit_logs"("created_at", "id");
CREATE INDEX "audit_logs_action_created_at_id_idx" ON "audit_logs"("action", "created_at", "id");
