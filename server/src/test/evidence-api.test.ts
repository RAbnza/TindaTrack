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
  StockMovementType,
  UserRole,
} from "../../generated/prisma/client.js";

import { app } from "../app.js";
import { prisma } from "../db/prisma.js";
import { recordSale } from "../services/sale.service.js";
import { recordStockAdjustment } from "../services/stock-adjustment.service.js";
import { recordStockReceipt } from "../services/stock-receipt.service.js";

const OWNER_PASSWORD =
  "EvidenceOwner123!";

const STAFF_PASSWORD =
  "EvidenceStaff123!";

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
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password,
    })
    .expect(200);

  return response.body.token as string;
}

async function createFixtures() {
  const ownerHash =
    await bcrypt.hash(
      OWNER_PASSWORD,
      4,
    );

  const staffHash =
    await bcrypt.hash(
      STAFF_PASSWORD,
      4,
    );

  const owner =
    await prisma.user.create({
      data: {
        name: "Evidence Owner",
        email:
          "evidence-owner@test.local",
        passwordHash:
          ownerHash,
        role: UserRole.OWNER,
        active: true,
      },
    });

  const staff =
    await prisma.user.create({
      data: {
        name: "Evidence Staff",
        email:
          "evidence-staff@test.local",
        passwordHash:
          staffHash,
        role: UserRole.STAFF,
        active: true,
      },
    });

  const supplier =
    await prisma.supplier.create({
      data: {
        name:
          "Evidence Supplier",
        active: true,
      },
    });

  const product =
    await prisma.product.create({
      data: {
        sku: "EVIDENCE-001",
        name:
          "Evidence Product",
        category: "Testing",

        /*
         * Deliberately different from the
         * historical sale price used below.
         */
        sellingPrice:
          "99.00",

        reorderLevel: 2,
        active: true,
      },
    });

  const ownerToken = await login(
    owner.email,
    OWNER_PASSWORD,
  );

  const staffToken = await login(
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
  "GET /api/reports/daily-sales",
  () => {
    it("returns sales for the requested Manila calendar day using historical SaleItem prices", async () => {
      const {
        owner,
        product,
        ownerToken,
      } =
        await createFixtures();

      /*
       * Manila 2026-10-01:
       *
       * start:
       * 2026-09-30T16:00:00.000Z
       *
       * end:
       * 2026-10-01T16:00:00.000Z
       */

      const firstSale =
        await prisma.sale.create({
          data: {
            recordedBy:
              owner.id,

            totalAmount:
              "50.00",

            paymentMethod:
              PaymentMethod.CASH,

            createdAt:
              new Date(
                "2026-09-30T16:00:00.000Z",
              ),

            saleItems: {
              create: [
                {
                  productId:
                    product.id,
                  quantity: 2,

                  /*
                   * Historical sale price.
                   * Product currently costs 99.
                   */
                  unitPrice:
                    "25.00",

                  lineTotal:
                    "50.00",
                },
              ],
            },
          },
        });

      await prisma.sale.create({
        data: {
          recordedBy:
            owner.id,

          totalAmount:
            "30.00",

          paymentMethod:
            PaymentMethod.GCASH,

          createdAt:
            new Date(
              "2026-10-01T15:59:59.999Z",
            ),

          saleItems: {
            create: [
              {
                productId:
                  product.id,
                quantity: 1,
                unitPrice:
                  "30.00",
                lineTotal:
                  "30.00",
              },
            ],
          },
        },
      });

      /*
       * Exactly midnight October 2
       * in Manila. Must be excluded.
       */
      await prisma.sale.create({
        data: {
          recordedBy:
            owner.id,

          totalAmount:
            "999.00",

          paymentMethod:
            PaymentMethod.MAYA,

          createdAt:
            new Date(
              "2026-10-01T16:00:00.000Z",
            ),

          saleItems: {
            create: [
              {
                productId:
                  product.id,
                quantity: 1,
                unitPrice:
                  "999.00",
                lineTotal:
                  "999.00",
              },
            ],
          },
        },
      });

      const response =
        await request(app)
          .get(
            "/api/reports/daily-sales",
          )
          .query({
            date:
              "2026-10-01",
          })
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .expect(200);

      expect(
        response.body.date,
      ).toBe("2026-10-01");

      expect(
        response.body.saleCount,
      ).toBe(2);

      expect(
        response.body
          .totalSalesAmount,
      ).toBe("80");

      expect(
        response.body.sales,
      ).toHaveLength(2);

      const returnedFirstSale =
        response.body.sales.find(
          (sale: {
            id: number;
          }) =>
            sale.id ===
            firstSale.id,
        );

      expect(
        returnedFirstSale,
      ).toBeDefined();

      expect(
        returnedFirstSale.items[0]
          .productName,
      ).toBe(
        product.name,
      );

      /*
       * Critical historical-price assertion.
       *
       * Product.sellingPrice is currently 99,
       * but the report must return the
       * persisted SaleItem price of 25.
       */
      expect(
        returnedFirstSale.items[0]
          .unitPrice,
      ).toBe("25");

      expect(
        returnedFirstSale.items[0]
          .lineTotal,
      ).toBe("50");
    });

    it("returns 400 for an invalid date", async () => {
      const {
        ownerToken,
      } =
        await createFixtures();

      await request(app)
        .get(
          "/api/reports/daily-sales",
        )
        .query({
          date:
            "2026-02-31",
        })
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .expect(400);
    });

    it("returns 403 for STAFF", async () => {
      const {
        staffToken,
      } =
        await createFixtures();

      await request(app)
        .get(
          "/api/reports/daily-sales",
        )
        .query({
          date:
            "2026-10-01",
        })
        .set(
          "Authorization",
          `Bearer ${staffToken}`,
        )
        .expect(403);
    });
  },
);

describe(
  "GET /api/stock-movements",
  () => {
    it("returns traceable receipt, adjustment, and sale ledger evidence", async () => {
      const {
        owner,
        supplier,
        product,
        ownerToken,
      } =
        await createFixtures();

      const receipt =
        await recordStockReceipt({
          supplierId:
            supplier.id,

          receivedBy:
            owner.id,

          referenceNo:
            "EVIDENCE-RECEIPT",

          items: [
            {
              productId:
                product.id,
              quantity: 10,
              unitCost:
                "50.00",
            },
          ],
        });

      const receiptItem =
        await prisma.stockReceiptItem.findFirstOrThrow(
          {
            where: {
              receiptId:
                receipt.id,
            },
          },
        );

      const adjustment =
        await recordStockAdjustment({
          productId:
            product.id,

          quantityDelta: 2,

          reason:
            "Evidence adjustment",

          adjustedBy:
            owner.id,
        });

      const sale =
        await recordSale({
          recordedBy:
            owner.id,

          paymentMethod:
            PaymentMethod.CASH,

          items: [
            {
              productId:
                product.id,
              quantity: 1,
            },
          ],
        });

      const saleItem =
        await prisma.saleItem.findFirstOrThrow(
          {
            where: {
              saleId:
                sale.id,
            },
          },
        );

      const response =
        await request(app)
          .get(
            "/api/stock-movements",
          )
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .expect(200);

      const receiptMovement =
        response.body.find(
          (movement: {
            type: string;
          }) =>
            movement.type ===
            StockMovementType.RECEIPT,
        );

      expect(
        receiptMovement,
      ).toBeDefined();

      expect(
        receiptMovement.product.id,
      ).toBe(product.id);

      expect(
        receiptMovement.actor.id,
      ).toBe(owner.id);

      expect(
        receiptMovement.source,
      ).toEqual({
        type: "RECEIPT",
        stockReceiptItemId:
          receiptItem.id,
      });

      const adjustmentMovement =
        response.body.find(
          (movement: {
            type: string;
          }) =>
            movement.type ===
            StockMovementType.ADJUSTMENT_IN,
        );

      expect(
        adjustmentMovement.source,
      ).toEqual({
        type: "ADJUSTMENT",
        stockAdjustmentId:
          adjustment.id,
      });

      const saleMovement =
        response.body.find(
          (movement: {
            type: string;
          }) =>
            movement.type ===
            StockMovementType.SALE,
        );

      expect(
        saleMovement,
      ).toBeDefined();

      expect(
        saleMovement.quantityDelta,
      ).toBe(-1);

      expect(
        saleMovement.source,
      ).toEqual({
        type: "SALE",
        saleItemId:
          saleItem.id,
      });
    });

    it("returns 403 for STAFF", async () => {
      const {
        staffToken,
      } =
        await createFixtures();

      await request(app)
        .get(
          "/api/stock-movements",
        )
        .set(
          "Authorization",
          `Bearer ${staffToken}`,
        )
        .expect(403);
    });
  },
);