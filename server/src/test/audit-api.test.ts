import bcrypt from "bcryptjs";
import request from "supertest";
import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  PaymentMethod,
  UserRole,
} from "../../generated/prisma/client.js";

import { app } from "../app.js";
import { prisma } from "../db/prisma.js";
import { recordStockAdjustment } from "../services/stock-adjustment.service.js";

const OWNER_PASSWORD =
  "AuditOwner123!";

const STAFF_PASSWORD =
  "AuditStaff123!";

async function cleanDatabase(): Promise<void> {
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

async function login(
  email: string,
  password: string,
): Promise<string> {
  const response =
    await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password,
      })
      .expect(200);

  return response.body.token as string;
}

async function createFixtures() {
  const ownerPasswordHash =
    await bcrypt.hash(
      OWNER_PASSWORD,
      4,
    );

  const staffPasswordHash =
    await bcrypt.hash(
      STAFF_PASSWORD,
      4,
    );

  const owner =
    await prisma.user.create({
      data: {
        name: "Audit Owner",
        email:
          "audit-owner@test.local",
        passwordHash:
          ownerPasswordHash,
        role: UserRole.OWNER,
        active: true,
      },
    });

  const staff =
    await prisma.user.create({
      data: {
        name: "Audit Staff",
        email:
          "audit-staff@test.local",
        passwordHash:
          staffPasswordHash,
        role: UserRole.STAFF,
        active: true,
      },
    });

  const supplier =
    await prisma.supplier.create({
      data: {
        name:
          "Audit Supplier",
        active: true,
      },
    });

  const product =
    await prisma.product.create({
      data: {
        sku: "AUDIT-001",
        name:
          "Audit Product",
        category: "Testing",
        sellingPrice: "25.00",
        reorderLevel: 2,
        active: true,
      },
    });

  const ownerToken =
    await login(
      owner.email,
      OWNER_PASSWORD,
    );

  const staffToken =
    await login(
      staff.email,
      STAFF_PASSWORD,
    );

  return {
    owner,
    staff,
    supplier,
    product,
    ownerToken,
    staffToken,
  };
}

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

describe(
  "transactional audit logging",
  () => {
    it("creates exactly one audit record for a successful sale", async () => {
      const {
        owner,
        product,
        ownerToken,
      } =
        await createFixtures();

      /*
       * Establish stock through the real
       * inventory flow.
       *
       * This itself creates an audit row,
       * so capture the count afterwards.
       */
      await recordStockAdjustment({
        productId:
          product.id,

        quantityDelta: 5,

        reason:
          "Prepare stock for sale audit test",

        adjustedBy:
          owner.id,
      });

      const auditCountBefore =
        await prisma.auditLog.count();

      const response =
        await request(app)
          .post("/api/sales")
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .send({
            paymentMethod:
              PaymentMethod.CASH,

            items: [
              {
                productId:
                  product.id,
                quantity: 2,
              },
            ],
          })
          .expect(201);

      expect(
        await prisma.auditLog.count(),
      ).toBe(
        auditCountBefore + 1,
      );

      const saleAudit =
        await prisma.auditLog.findFirst({
          where: {
            action:
              "SALE_CREATED",

            entityType:
              "Sale",

            entityId:
              response.body.id,
          },
        });

      expect(
        saleAudit,
      ).not.toBeNull();

      expect(
        saleAudit?.actorId,
      ).toBe(owner.id);

      expect(
        saleAudit?.metadata,
      ).toEqual({
        totalAmount: "50",
        paymentMethod:
          PaymentMethod.CASH,
        itemCount: 1,
      });
    });

    it("creates no audit record for an insufficient-stock sale", async () => {
      const {
        product,
        ownerToken,
      } =
        await createFixtures();

      const auditCountBefore =
        await prisma.auditLog.count();

      await request(app)
        .post("/api/sales")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          paymentMethod:
            PaymentMethod.CASH,

          items: [
            {
              productId:
                product.id,
              quantity: 1,
            },
          ],
        })
        .expect(400);

      expect(
        await prisma.sale.count(),
      ).toBe(0);

      expect(
        await prisma.auditLog.count(),
      ).toBe(
        auditCountBefore,
      );

      expect(
        await prisma.auditLog.count({
          where: {
            action:
              "SALE_CREATED",
          },
        }),
      ).toBe(0);
    });

    it("creates an audit record for a successful stock receipt", async () => {
      const {
        owner,
        supplier,
        product,
        ownerToken,
      } =
        await createFixtures();

      const auditCountBefore =
        await prisma.auditLog.count();

      const response =
        await request(app)
          .post(
            "/api/stock-receipts",
          )
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .send({
            supplierId:
              supplier.id,

            referenceNo:
              "AUDIT-RCP-001",

            items: [
              {
                productId:
                  product.id,
                quantity: 5,
                unitCost:
                  "15.00",
              },
            ],
          })
          .expect(201);

      expect(
        await prisma.auditLog.count(),
      ).toBe(
        auditCountBefore + 1,
      );

      const audit =
        await prisma.auditLog.findFirst({
          where: {
            action:
              "STOCK_RECEIPT_CREATED",

            entityType:
              "StockReceipt",

            entityId:
              response.body.id,
          },
        });

      expect(
        audit,
      ).not.toBeNull();

      expect(
        audit?.actorId,
      ).toBe(owner.id);
    });

    it("creates an audit record for a successful stock adjustment", async () => {
      const {
        owner,
        product,
        ownerToken,
      } =
        await createFixtures();

      const auditCountBefore =
        await prisma.auditLog.count();

      const response =
        await request(app)
          .post(
            "/api/adjustments",
          )
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .send({
            productId:
              product.id,

            quantityDelta: 3,

            reason:
              "Audit adjustment",
          })
          .expect(201);

      expect(
        await prisma.auditLog.count(),
      ).toBe(
        auditCountBefore + 1,
      );

      const audit =
        await prisma.auditLog.findFirst({
          where: {
            action:
              "STOCK_ADJUSTMENT_CREATED",

            entityType:
              "StockAdjustment",

            entityId:
              response.body.id,
          },
        });

      expect(
        audit,
      ).not.toBeNull();

      /*
       * This proves the actor comes from
       * authenticated request context.
       */
      expect(
        audit?.actorId,
      ).toBe(owner.id);
    });
  },
);

describe(
  "GET /api/audit-logs",
  () => {
    it("returns 403 for STAFF", async () => {
      const {
        staffToken,
      } =
        await createFixtures();

      await request(app)
        .get("/api/audit-logs")
        .set(
          "Authorization",
          `Bearer ${staffToken}`,
        )
        .expect(403);
    });

    it("allows OWNER to read audit logs newest first", async () => {
      const {
        owner,
        product,
        ownerToken,
      } =
        await createFixtures();

      await request(app)
        .post("/api/adjustments")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          productId:
            product.id,

          quantityDelta: 2,

          reason:
            "First audit event",
        })
        .expect(201);

      await request(app)
        .post("/api/adjustments")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          productId:
            product.id,

          quantityDelta: 1,

          reason:
            "Second audit event",
        })
        .expect(201);

      const response =
        await request(app)
          .get("/api/audit-logs")
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .expect(200);

      expect(
        response.body,
      ).toHaveLength(2);

      expect(
        response.body[0].actor,
      ).toEqual({
        id: owner.id,
        name: owner.name,
        role: UserRole.OWNER,
      });

      expect(
        response.body[0].action,
      ).toBe(
        "STOCK_ADJUSTMENT_CREATED",
      );

      expect(
        response.body[1].action,
      ).toBe(
        "STOCK_ADJUSTMENT_CREATED",
      );

      const firstCreatedAt =
        new Date(
          response.body[0].createdAt,
        ).getTime();

      const secondCreatedAt =
        new Date(
          response.body[1].createdAt,
        ).getTime();

      expect(
        firstCreatedAt,
      ).toBeGreaterThanOrEqual(
        secondCreatedAt,
      );
    });
  },
);