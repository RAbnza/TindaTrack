import bcrypt from "bcryptjs";
import { readFile } from "node:fs/promises";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { prisma } from "../db/prisma.js";

async function clean() {
  await prisma.stockMovement.deleteMany();
  await prisma.stockAdjustment.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.stockReceiptItem.deleteMany();
  await prisma.stockReceipt.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
}
beforeEach(clean);
afterAll(async () => {
  await clean();
  await prisma.$disconnect();
});

async function fixtures() {
  const password = "PaginationTest123!";
  const passwordHash = await bcrypt.hash(password, 4);
  const owner = await prisma.user.create({
    data: {
      name: "Pagination Owner",
      email: "page-owner@test.local",
      passwordHash,
      role: "OWNER",
    },
  });
  const staff = await prisma.user.create({
    data: {
      name: "Pagination Staff",
      email: "page-staff@test.local",
      passwordHash,
      role: "STAFF",
    },
  });
  const login = async (email: string) =>
    (await request(app).post("/api/auth/login").send({ email, password }).expect(200))
      .body.token as string;
  const ownerToken = await login(owner.email);
  const staffToken = await login(staff.email);
  await prisma.product.createMany({
    data: Array.from({ length: 121 }, (_, i) => ({
      name: `Product ${String(i).padStart(3, "0")}`,
      sku: `PAGE-${String(i).padStart(3, "0")}`,
      category: i % 2 ? "Drinks" : "Grocery",
      sellingPrice: "99",
      active: i < 120,
    })),
  });
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  const product = products[0]!;
  const adjustments = await prisma.stockAdjustment.createManyAndReturn({
    data: Array.from({ length: 135 }, (_, i) => ({
      productId: product.id,
      adjustedBy: owner.id,
      quantityDelta: i % 2 ? -1 : 2,
      reason: "Pagination fixture",
      createdAt: new Date("2026-10-01T01:00:00Z"),
    })),
  });
  await prisma.stockMovement.createMany({
    data: adjustments.map((a) => ({
      productId: product.id,
      actorId: owner.id,
      stockAdjustmentId: a.id,
      type: a.quantityDelta < 0 ? "ADJUSTMENT_OUT" : "ADJUSTMENT_IN",
      quantityDelta: a.quantityDelta,
      createdAt: a.createdAt,
    })),
  });
  await prisma.auditLog.createMany({
    data: Array.from({ length: 135 }, (_, i) => ({
      actorId: i % 2 ? staff.id : owner.id,
      action: i % 2 ? "SALE_CREATED" : "STOCK_RECEIPT_CREATED",
      entityType: "Sale",
      entityId: i + 1,
      metadata: { itemCount: 1, totalAmount: "25", paymentMethod: "CASH" },
      createdAt: new Date("2026-10-01T01:00:00Z"),
    })),
  });
  await prisma.sale.createMany({
    data: Array.from({ length: 121 }, (_, i) => ({
      recordedBy: owner.id,
      paymentMethod: "CASH",
      totalAmount: "25",
      createdAt:
        i === 120 ? new Date("2026-10-01T16:00:00Z") : new Date("2026-09-30T16:00:00Z"),
    })),
  });
  const sales = await prisma.sale.findMany();
  await prisma.saleItem.createMany({
    data: sales.map((s) => ({
      saleId: s.id,
      productId: product.id,
      quantity: 1,
      unitPrice: "25",
      lineTotal: "25",
    })),
  });
  return { ownerToken, staffToken, product };
}

describe("database-paginated workspace reads", () => {
  it("validates the pagination index migration without retaining test DDL", async () => {
    const sql = await readFile(new URL("../../prisma/migrations/20261002090000_workspace_pagination_indexes/migration.sql", import.meta.url), "utf8");
    const statements = sql.split(";").map(s => s.trim()).filter(Boolean);
    const names = statements.map(s => /CREATE INDEX "([^"]+)"/.exec(s)![1]);
    const rollback = new Error("Roll back migration verification");
    await expect(prisma.$transaction(async db => {
      const existing = await db.$queryRaw<Array<{ indexname: string }>>`SELECT indexname FROM pg_indexes WHERE schemaname = current_schema()`;
      for (let i = 0; i < statements.length; i++) {
        if (!existing.some(index => index.indexname === names[i])) await db.$executeRawUnsafe(statements[i]!);
      }
      const indexes = await db.$queryRaw<Array<{ indexname: string }>>`SELECT indexname FROM pg_indexes WHERE schemaname = current_schema()`;
      expect(names).toHaveLength(7);
      for (const name of names) expect(indexes.some(index => index.indexname === name)).toBe(true);
      throw rollback;
    })).rejects.toBe(rollback);
  });
  it("bounds product pages, filters the whole catalog, and returns ledger stock", async () => {
    const { staffToken, product } = await fixtures();
    const read = (query: object) =>
      request(app)
        .get("/api/products/browse")
        .query(query)
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(200);
    const first = (await read({ pageSize: 10 })).body;
    const second = (await read({ page: 2, pageSize: 10 })).body;
    expect(first.pagination).toEqual({
      page: 1,
      pageSize: 10,
      total: 120,
      totalPages: 12,
    });
    expect(first.items).toHaveLength(10);
    expect(first.items[0].id).toBe(product.id);
    expect(first.items[0].currentStock).toBe(69);
    expect(new Set([...first.items, ...second.items].map((p) => p.id)).size).toBe(20);
    const filtered = (await read({ search: "page-119", category: "drinks", sort: "sku" }))
      .body;
    expect(filtered.pagination.total).toBe(1);
    expect(filtered.items[0].sku).toBe("PAGE-119");
    const beyond = (await read({ page: 999, pageSize: 10 })).body;
    expect(beyond.pagination.page).toBe(12);
    expect(beyond.items).toHaveLength(10);
    const selected = await request(app)
      .get("/api/products/selection")
      .query({ ids: String(product.id) })
      .set("Authorization", `Bearer ${staffToken}`)
      .expect(200);
    expect(selected.body).toHaveLength(1);
    expect(selected.body[0].currentStock).toBe(69);
    await request(app)
      .get("/api/products/selection")
      .query({ ids: "1,invalid" })
      .set("Authorization", `Bearer ${staffToken}`)
      .expect(400);
    await request(app)
      .get("/api/products/selection")
      .query({ ids: Array(101).fill(product.id).join(",") })
      .set("Authorization", `Bearer ${staffToken}`)
      .expect(400);
  });
  it("paginates audit/movement history with stable ties and database filters", async () => {
    const { ownerToken } = await fixtures();
    for (const path of ["audit-logs", "stock-movements"]) {
      const read = (query: object) =>
        request(app)
          .get(`/api/${path}/browse`)
          .query(query)
          .set("Authorization", `Bearer ${ownerToken}`)
          .expect(200);
      const first = (await read({ pageSize: 25 })).body;
      const last = (await read({ page: 6, pageSize: 25 })).body;
      expect(first.pagination.total).toBe(135);
      expect(first.items).toHaveLength(25);
      expect(last.items).toHaveLength(10);
      expect(first.items[0].id).toBeGreaterThan(last.items[0].id);
      const filtered = (
        await read({
          filter: path === "audit-logs" ? "SALES" : "ADJUSTMENT",
          search: path === "audit-logs" ? "Staff" : "PAGE-000",
          from: "2026-10-01",
          to: "2026-10-01",
        })
      ).body;
      expect(filtered.pagination.total).toBe(path === "audit-logs" ? 67 : 135);
      const empty = (await read({ from: "2026-10-02" })).body;
      expect(empty.items).toEqual([]);
      expect(empty.pagination).toMatchObject({ page: 1, total: 0, totalPages: 1 });
    }
  });
  it("aggregates the complete Manila day while paging historical sale snapshots", async () => {
    const { ownerToken } = await fixtures();
    const response = await request(app)
      .get("/api/reports/daily-sales/browse")
      .query({ date: "2026-10-01", page: 5, pageSize: 25 })
      .set("Authorization", `Bearer ${ownerToken}`)
      .expect(200);
    expect(response.body.saleCount).toBe(120);
    expect(response.body.totalSalesAmount).toBe("3000");
    expect(response.body.sales).toHaveLength(20);
    expect(response.body.sales[0].items[0].unitPrice).toBe("25");
    expect(response.body.pagination).toEqual({
      page: 5,
      pageSize: 25,
      total: 120,
      totalPages: 5,
    });
  });
  it("keeps RBAC and rejects malformed/oversized page requests", async () => {
    const { ownerToken, staffToken } = await fixtures();
    for (const path of [
      "products/browse",
      "audit-logs/browse",
      "stock-movements/browse",
      "reports/daily-sales/browse",
    ]) {
      await request(app).get(`/api/${path}`).expect(401);
      for (const query of [{ page: 0 }, { pageSize: 101 }, { page: "bad" }])
        await request(app)
          .get(`/api/${path}`)
          .query({
            ...(path.startsWith("reports") ? { date: "2026-10-01" } : {}),
            ...query,
          })
          .set("Authorization", `Bearer ${ownerToken}`)
          .expect(400);
      if (!path.startsWith("products"))
        await request(app)
          .get(`/api/${path}`)
          .query({ date: "2026-10-01" })
          .set("Authorization", `Bearer ${staffToken}`)
          .expect(403);
    }
    await request(app)
      .get("/api/audit-logs/browse")
      .query({ from: "2026-02-31" })
      .set("Authorization", `Bearer ${ownerToken}`)
      .expect(400);
    await request(app)
      .get("/api/stock-movements/browse")
      .query({ from: "2026-10-02", to: "2026-10-01" })
      .set("Authorization", `Bearer ${ownerToken}`)
      .expect(400);
  });
});
