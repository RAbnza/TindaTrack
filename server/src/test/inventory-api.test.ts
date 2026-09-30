import request from "supertest";
import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  StockMovementType,
  UserRole,
} from "../../generated/prisma/client.js";

import { app } from "../app.js";
import { prisma } from "../db/prisma.js";
import { getCurrentStock } from "../repositories/product.repository.js";

async function cleanDatabase(): Promise<void> {
  await prisma.stockMovement.deleteMany();
  await prisma.stockAdjustment.deleteMany();

  await prisma.stockReceiptItem.deleteMany();
  await prisma.stockReceipt.deleteMany();

  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();

  await prisma.auditLog.deleteMany();

  await prisma.supplier.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
}

async function createBaseFixtures() {
  const user = await prisma.user.create({
    data: {
      name: "Test Owner",
      email: "owner@test.local",
      passwordHash: "integration-test-placeholder",
      role: UserRole.OWNER,
      active: true,
    },
  });

  const supplier = await prisma.supplier.create({
    data: {
      name: "Test Supplier",
      active: true,
    },
  });

  const product = await prisma.product.create({
    data: {
      sku: "TEST-001",
      name: "Test Product",
      category: "Test Category",
      sellingPrice: "25.00",
      reorderLevel: 5,
      active: true,
    },
  });

  const secondProduct = await prisma.product.create({
    data: {
      sku: "TEST-002",
      name: "Second Test Product",
      category: null,
      sellingPrice: "10.00",
      reorderLevel: 2,
      active: true,
    },
  });

  return {
    user,
    supplier,
    product,
    secondProduct,
  };
}

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

describe("GET /api/products", () => {
  it("returns 200 with the inventory read model", async () => {
    const { product } = await createBaseFixtures();

    const response = await request(app)
      .get("/api/products")
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: product.id,
          sku: product.sku,
          name: product.name,
          sellingPrice: "25",
          reorderLevel: 5,
          active: true,
          currentStock: 0,
          lowStock: true,
        }),
      ]),
    );
  });

  it("derives currentStock from StockMovement", async () => {
    const { user, product } = await createBaseFixtures();

    await request(app)
      .post("/api/adjustments")
      .send({
        productId: product.id,
        quantityDelta: 8,
        reason: "Establish ledger stock",
        adjustedBy: user.id,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/products")
      .expect(200);

    const returnedProduct = response.body.find(
      (item: { id: number }) => item.id === product.id,
    );

    expect(returnedProduct).toBeDefined();
    expect(returnedProduct.currentStock).toBe(8);
    expect(returnedProduct.reorderLevel).toBe(5);
    expect(returnedProduct.lowStock).toBe(false);
  });
});

describe("GET /api/products/:id", () => {
  it("returns 200 for an existing Product", async () => {
    const { product } = await createBaseFixtures();

    const response = await request(app)
      .get(`/api/products/${product.id}`)
      .expect(200);

    expect(response.body).toEqual({
      id: product.id,
      sku: "TEST-001",
      name: "Test Product",
      category: "Test Category",
      sellingPrice: "25",
      reorderLevel: 5,
      active: true,
      currentStock: 0,
      lowStock: true,
    });
  });

  it("reflects ledger movements in currentStock and lowStock", async () => {
    const { user, product } = await createBaseFixtures();

    const initialResponse = await request(app)
      .get(`/api/products/${product.id}`)
      .expect(200);

    expect(initialResponse.body.currentStock).toBe(0);
    expect(initialResponse.body.lowStock).toBe(true);

    // Stock becomes exactly equal to reorder level.
    await request(app)
      .post("/api/adjustments")
      .send({
        productId: product.id,
        quantityDelta: 5,
        reason: "Bring stock to reorder level",
        adjustedBy: user.id,
      })
      .expect(201);

    const equalResponse = await request(app)
      .get(`/api/products/${product.id}`)
      .expect(200);

    expect(equalResponse.body.currentStock).toBe(5);
    expect(equalResponse.body.lowStock).toBe(true);

    // Stock becomes greater than reorder level.
    await request(app)
      .post("/api/adjustments")
      .send({
        productId: product.id,
        quantityDelta: 1,
        reason: "Move stock above reorder level",
        adjustedBy: user.id,
      })
      .expect(201);

    const aboveResponse = await request(app)
      .get(`/api/products/${product.id}`)
      .expect(200);

    expect(aboveResponse.body.currentStock).toBe(6);
    expect(aboveResponse.body.lowStock).toBe(false);
  });

  it("returns 400 for a malformed Product ID", async () => {
    await request(app)
      .get("/api/products/abc")
      .expect(400);
  });

  it("returns 404 for a Product that does not exist", async () => {
    await request(app)
      .get("/api/products/999999999")
      .expect(404);
  });
});

describe("POST /api/stock-receipts", () => {
  it("returns 201 and atomically creates receipt, item, RECEIPT movement, and stock", async () => {
    const { user, supplier, product } =
      await createBaseFixtures();

    const stockBefore = await getCurrentStock(product.id);

    const response = await request(app)
      .post("/api/stock-receipts")
      .send({
        supplierId: supplier.id,
        receivedBy: user.id,
        referenceNo: "TEST-INV-001",
        items: [
          {
            productId: product.id,
            quantity: 8,
            unitCost: "15.50",
          },
        ],
      })
      .expect(201);

    const receipt = await prisma.stockReceipt.findUnique({
      where: {
        id: response.body.id,
      },
    });

    expect(receipt).not.toBeNull();

    const receiptItems =
      await prisma.stockReceiptItem.findMany({
        where: {
          receiptId: response.body.id,
        },
      });

    expect(receiptItems).toHaveLength(1);

    const receiptItem = receiptItems[0];

    expect(receiptItem).toBeDefined();

    const movement = await prisma.stockMovement.findUnique({
      where: {
        stockReceiptItemId: receiptItem!.id,
      },
    });

    expect(movement).not.toBeNull();
    expect(movement?.type).toBe(
      StockMovementType.RECEIPT,
    );
    expect(movement?.productId).toBe(product.id);
    expect(movement?.quantityDelta).toBe(8);
    expect(movement?.actorId).toBe(user.id);

    const stockAfter = await getCurrentStock(product.id);

    expect(stockAfter).toBe(stockBefore + 8);
  });

  it("returns 400 for a malformed body", async () => {
    const { user, supplier, product } =
      await createBaseFixtures();

    const response = await request(app)
      .post("/api/stock-receipts")
      .send({
        supplierId: supplier.id,
        receivedBy: user.id,
        items: [
          {
            productId: product.id,
            quantity: 0,
            unitCost: "15.50",
          },
        ],
      })
      .expect(400);

    expect(response.body.error).toBe(
      "Invalid stock receipt request.",
    );

    expect(
      await prisma.stockReceipt.count(),
    ).toBe(0);

    expect(
      await prisma.stockReceiptItem.count(),
    ).toBe(0);

    expect(
      await prisma.stockMovement.count(),
    ).toBe(0);
  });

  it("returns 400 for duplicate product IDs", async () => {
    const { user, supplier, product } =
      await createBaseFixtures();

    await request(app)
      .post("/api/stock-receipts")
      .send({
        supplierId: supplier.id,
        receivedBy: user.id,
        items: [
          {
            productId: product.id,
            quantity: 2,
            unitCost: "10.00",
          },
          {
            productId: product.id,
            quantity: 3,
            unitCost: "10.00",
          },
        ],
      })
      .expect(400);

    expect(
      await prisma.stockReceipt.count(),
    ).toBe(0);

    expect(
      await prisma.stockReceiptItem.count(),
    ).toBe(0);

    expect(
      await prisma.stockMovement.count(),
    ).toBe(0);
  });

  it("rolls back the whole receipt when a later item fails after the first item and movement were written", async () => {
    const {
      user,
      supplier,
      product,
      secondProduct,
    } = await createBaseFixtures();

    const beforeReceiptCount =
      await prisma.stockReceipt.count();

    const beforeItemCount =
      await prisma.stockReceiptItem.count();

    const beforeMovementCount =
      await prisma.stockMovement.count();

    const firstStockBefore =
      await getCurrentStock(product.id);

    const secondStockBefore =
      await getCurrentStock(secondProduct.id);

    await request(app)
      .post("/api/stock-receipts")
      .send({
        supplierId: supplier.id,
        receivedBy: user.id,
        referenceNo: "ROLLBACK-TEST",
        items: [
          {
            productId: product.id,
            quantity: 5,
            unitCost: "15.50",
          },
          {
            productId: secondProduct.id,
            quantity: 2,

            // Valid transport shape, but too large for NUMERIC(12,2).
            unitCost: "10000000000.00",
          },
        ],
      })
      .expect(500);

    expect(
      await prisma.stockReceipt.count(),
    ).toBe(beforeReceiptCount);

    expect(
      await prisma.stockReceiptItem.count(),
    ).toBe(beforeItemCount);

    expect(
      await prisma.stockMovement.count(),
    ).toBe(beforeMovementCount);

    expect(
      await getCurrentStock(product.id),
    ).toBe(firstStockBefore);

    expect(
      await getCurrentStock(secondProduct.id),
    ).toBe(secondStockBefore);
  });

  it("rejects an inactive supplier", async () => {
    const { user, supplier, product } =
      await createBaseFixtures();

    await prisma.supplier.update({
      where: {
        id: supplier.id,
      },
      data: {
        active: false,
      },
    });

    await request(app)
      .post("/api/stock-receipts")
      .send({
        supplierId: supplier.id,
        receivedBy: user.id,
        items: [
          {
            productId: product.id,
            quantity: 4,
            unitCost: "12.00",
          },
        ],
      })
      .expect(400);

    expect(
      await prisma.stockReceipt.count(),
    ).toBe(0);

    expect(
      await prisma.stockReceiptItem.count(),
    ).toBe(0);

    expect(
      await prisma.stockMovement.count(),
    ).toBe(0);
  });

  it("rejects an inactive product", async () => {
    const { user, supplier, product } =
      await createBaseFixtures();

    await prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        active: false,
      },
    });

    await request(app)
      .post("/api/stock-receipts")
      .send({
        supplierId: supplier.id,
        receivedBy: user.id,
        items: [
          {
            productId: product.id,
            quantity: 4,
            unitCost: "12.00",
          },
        ],
      })
      .expect(400);

    expect(
      await prisma.stockReceipt.count(),
    ).toBe(0);

    expect(
      await prisma.stockReceiptItem.count(),
    ).toBe(0);

    expect(
      await prisma.stockMovement.count(),
    ).toBe(0);
  });
});

describe("POST /api/adjustments", () => {
  it("returns 201 for a valid positive adjustment and creates an ADJUSTMENT_IN movement", async () => {
    const { user, product } =
      await createBaseFixtures();

    const stockBefore = await getCurrentStock(product.id);

    const response = await request(app)
      .post("/api/adjustments")
      .send({
        productId: product.id,
        quantityDelta: 6,
        reason: "Integration test adjustment",
        adjustedBy: user.id,
      })
      .expect(201);

    const adjustment =
      await prisma.stockAdjustment.findUnique({
        where: {
          id: response.body.id,
        },
      });

    expect(adjustment).not.toBeNull();
    expect(adjustment?.quantityDelta).toBe(6);

    const movement = await prisma.stockMovement.findUnique({
      where: {
        stockAdjustmentId: response.body.id,
      },
    });

    expect(movement).not.toBeNull();
    expect(movement?.type).toBe(
      StockMovementType.ADJUSTMENT_IN,
    );
    expect(movement?.quantityDelta).toBe(6);
    expect(movement?.productId).toBe(product.id);
    expect(movement?.actorId).toBe(user.id);

    const stockAfter = await getCurrentStock(product.id);

    expect(stockAfter).toBe(stockBefore + 6);
  });

  it("returns 201 for a valid negative adjustment and creates an ADJUSTMENT_OUT movement", async () => {
    const { user, product } =
      await createBaseFixtures();

    // Establish enough stock first.
    await request(app)
      .post("/api/adjustments")
      .send({
        productId: product.id,
        quantityDelta: 10,
        reason: "Establish starting stock",
        adjustedBy: user.id,
      })
      .expect(201);

    const stockBefore = await getCurrentStock(product.id);

    expect(stockBefore).toBe(10);

    const response = await request(app)
      .post("/api/adjustments")
      .send({
        productId: product.id,
        quantityDelta: -4,
        reason: "Remove damaged stock",
        adjustedBy: user.id,
      })
      .expect(201);

    const adjustment =
      await prisma.stockAdjustment.findUnique({
        where: {
          id: response.body.id,
        },
      });

    expect(adjustment).not.toBeNull();
    expect(adjustment?.quantityDelta).toBe(-4);

    const movement = await prisma.stockMovement.findUnique({
      where: {
        stockAdjustmentId: response.body.id,
      },
    });

    expect(movement).not.toBeNull();
    expect(movement?.type).toBe(
      StockMovementType.ADJUSTMENT_OUT,
    );
    expect(movement?.quantityDelta).toBe(-4);
    expect(movement?.productId).toBe(product.id);
    expect(movement?.actorId).toBe(user.id);

    const stockAfter = await getCurrentStock(product.id);

    expect(stockAfter).toBe(6);
    expect(stockAfter).toBe(stockBefore - 4);
  });

  it("returns 400 when quantityDelta is 0", async () => {
    const { user, product } =
      await createBaseFixtures();

    await request(app)
      .post("/api/adjustments")
      .send({
        productId: product.id,
        quantityDelta: 0,
        reason: "Invalid zero adjustment",
        adjustedBy: user.id,
      })
      .expect(400);

    expect(
      await prisma.stockAdjustment.count(),
    ).toBe(0);

    expect(
      await prisma.stockMovement.count(),
    ).toBe(0);
  });

  it("rejects an adjustment that would create negative inventory without changing database state", async () => {
    const { user, product } =
      await createBaseFixtures();

    await request(app)
      .post("/api/adjustments")
      .send({
        productId: product.id,
        quantityDelta: 2,
        reason: "Establish starting stock",
        adjustedBy: user.id,
      })
      .expect(201);

    const stockBefore = await getCurrentStock(product.id);

    expect(stockBefore).toBe(2);

    const adjustmentCountBefore =
      await prisma.stockAdjustment.count();

    const movementCountBefore =
      await prisma.stockMovement.count();

    await request(app)
      .post("/api/adjustments")
      .send({
        productId: product.id,
        quantityDelta: -3,
        reason: "Would make inventory negative",
        adjustedBy: user.id,
      })
      .expect(400);

    const adjustmentCountAfter =
      await prisma.stockAdjustment.count();

    const movementCountAfter =
      await prisma.stockMovement.count();

    const stockAfter = await getCurrentStock(product.id);

    expect(adjustmentCountAfter).toBe(
      adjustmentCountBefore,
    );

    expect(movementCountAfter).toBe(
      movementCountBefore,
    );

    expect(stockAfter).toBe(stockBefore);
  });

  it("rejects an inactive user", async () => {
    const { user, product } =
      await createBaseFixtures();

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        active: false,
      },
    });

    const stockBefore = await getCurrentStock(product.id);

    await request(app)
      .post("/api/adjustments")
      .send({
        productId: product.id,
        quantityDelta: 3,
        reason: "Should be rejected",
        adjustedBy: user.id,
      })
      .expect(400);

    expect(
      await prisma.stockAdjustment.count(),
    ).toBe(0);

    expect(
      await prisma.stockMovement.count(),
    ).toBe(0);

    expect(
      await getCurrentStock(product.id),
    ).toBe(stockBefore);
  });

  it("rejects an inactive product", async () => {
    const { user, product } =
      await createBaseFixtures();

    await prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        active: false,
      },
    });

    const stockBefore = await getCurrentStock(product.id);

    await request(app)
      .post("/api/adjustments")
      .send({
        productId: product.id,
        quantityDelta: 3,
        reason: "Should be rejected",
        adjustedBy: user.id,
      })
      .expect(400);

    expect(
      await prisma.stockAdjustment.count(),
    ).toBe(0);

    expect(
      await prisma.stockMovement.count(),
    ).toBe(0);

    expect(
      await getCurrentStock(product.id),
    ).toBe(stockBefore);
  });
});