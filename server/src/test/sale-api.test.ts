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

import {
  app,
} from "../app.js";

import {
  prisma,
} from "../db/prisma.js";

import {
  getCurrentStock,
} from "../repositories/product.repository.js";

import {
  recordStockAdjustment,
} from "../services/stock-adjustment.service.js";

const TEST_PASSWORD =
  "SaleTestPassword123!";

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

async function loginUser(
  email: string,
  password: string,
): Promise<string> {
  const response =
    await request(app)
      .post(
        "/api/auth/login",
      )
      .send({
        email,
        password,
      })
      .expect(200);

  return response.body
    .token as string;
}

async function createSaleFixtures() {
  const passwordHash =
    await bcrypt.hash(
      TEST_PASSWORD,
      4,
    );

  const user =
    await prisma.user.create({
      data: {
        name:
          "Sale Test Owner",

        email:
          "sale-owner@test.local",

        passwordHash,

        role:
          UserRole.OWNER,

        active: true,
      },
    });

  const firstProduct =
    await prisma.product.create({
      data: {
        sku:
          "SALE-001",

        name:
          "Sale Product One",

        category:
          "Testing",

        sellingPrice:
          "25.00",

        reorderLevel: 2,
        active: true,
      },
    });

  const secondProduct =
    await prisma.product.create({
      data: {
        sku:
          "SALE-002",

        name:
          "Sale Product Two",

        category:
          "Testing",

        sellingPrice:
          "10.50",

        reorderLevel: 2,
        active: true,
      },
    });

  const token =
    await loginUser(
      user.email,
      TEST_PASSWORD,
    );

  return {
    user,
    token,
    firstProduct,
    secondProduct,
  };
}

async function addStock(
  userId: number,
  productId: number,
  quantity: number,
): Promise<void> {
  await recordStockAdjustment({
    productId,

    quantityDelta:
      quantity,

    reason:
      "Prepare stock for sale API integration test",

    adjustedBy:
      userId,
  });
}

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();

  await prisma.$disconnect();
});

describe(
  "POST /api/sales",
  () => {
    it(
      "creates a successful multi-item sale with authoritative totals and SALE movements",
      async () => {
        const {
          user,
          token,
          firstProduct,
          secondProduct,
        } =
          await createSaleFixtures();

        await addStock(
          user.id,
          firstProduct.id,
          10,
        );

        await addStock(
          user.id,
          secondProduct.id,
          10,
        );

        const firstStockBefore =
          await getCurrentStock(
            firstProduct.id,
          );

        const secondStockBefore =
          await getCurrentStock(
            secondProduct.id,
          );

        const response =
          await request(app)
            .post(
              "/api/sales",
            )
            .set(
              "Authorization",
              `Bearer ${token}`,
            )
            .send({
              paymentMethod:
                "CASH",

              items: [
                {
                  productId:
                    firstProduct.id,

                  quantity: 2,
                },
                {
                  productId:
                    secondProduct.id,

                  quantity: 3,
                },
              ],
            })
            .expect(201);

        expect(
          response.body
            .recordedBy,
        ).toBe(
          user.id,
        );

        expect(
          response.body
            .recordedByName,
        ).toBe(
          user.name,
        );

        expect(
          response.body
            .paymentMethod,
        ).toBe(
          PaymentMethod.CASH,
        );

        expect(
          response.body
            .totalAmount,
        ).toBe(
          "81.5",
        );

        expect(
          response.body.items,
        ).toEqual([
          {
            productId:
              firstProduct.id,

            productName:
              firstProduct.name,

            quantity: 2,

            unitPrice:
              "25",

            lineTotal:
              "50",
          },

          {
            productId:
              secondProduct.id,

            productName:
              secondProduct.name,

            quantity: 3,

            unitPrice:
              "10.5",

            lineTotal:
              "31.5",
          },
        ]);

        const sale =
          await prisma.sale.findUnique({
            where: {
              id:
                response.body.id,
            },

            include: {
              saleItems: {
                include: {
                  stockMovement:
                    true,
                },

                orderBy: {
                  productId:
                    "asc",
                },
              },
            },
          });

        expect(
          sale,
        ).not.toBeNull();

        expect(
          sale?.recordedBy,
        ).toBe(
          user.id,
        );

        expect(
          sale?.totalAmount.toString(),
        ).toBe(
          "81.5",
        );

        expect(
          sale?.saleItems,
        ).toHaveLength(
          2,
        );

        const firstItem =
          sale?.saleItems.find(
            (item) =>
              item.productId ===
              firstProduct.id,
          );

        const secondItem =
          sale?.saleItems.find(
            (item) =>
              item.productId ===
              secondProduct.id,
          );

        expect(
          firstItem,
        ).toBeDefined();

        expect(
          secondItem,
        ).toBeDefined();

        expect(
          firstItem
            ?.unitPrice
            .toString(),
        ).toBe(
          "25",
        );

        expect(
          firstItem
            ?.lineTotal
            .toString(),
        ).toBe(
          "50",
        );

        expect(
          secondItem
            ?.unitPrice
            .toString(),
        ).toBe(
          "10.5",
        );

        expect(
          secondItem
            ?.lineTotal
            .toString(),
        ).toBe(
          "31.5",
        );

        expect(
          firstItem
            ?.stockMovement
            ?.type,
        ).toBe(
          StockMovementType.SALE,
        );

        expect(
          firstItem
            ?.stockMovement
            ?.quantityDelta,
        ).toBe(
          -2,
        );

        expect(
          firstItem
            ?.stockMovement
            ?.actorId,
        ).toBe(
          user.id,
        );

        expect(
          secondItem
            ?.stockMovement
            ?.type,
        ).toBe(
          StockMovementType.SALE,
        );

        expect(
          secondItem
            ?.stockMovement
            ?.quantityDelta,
        ).toBe(
          -3,
        );

        expect(
          secondItem
            ?.stockMovement
            ?.actorId,
        ).toBe(
          user.id,
        );

        expect(
          await getCurrentStock(
            firstProduct.id,
          ),
        ).toBe(
          firstStockBefore -
            2,
        );

        expect(
          await getCurrentStock(
            secondProduct.id,
          ),
        ).toBe(
          secondStockBefore -
            3,
        );
      },
    );

    it(
      "returns 400 for a malformed body",
      async () => {
        const {
          token,
          firstProduct,
        } =
          await createSaleFixtures();

        await request(app)
          .post(
            "/api/sales",
          )
          .set(
            "Authorization",
            `Bearer ${token}`,
          )
          .send({
            paymentMethod:
              "CASH",

            items: [
              {
                productId:
                  firstProduct.id,

                quantity: 0,
              },
            ],
          })
          .expect(400);

        expect(
          await prisma.sale.count(),
        ).toBe(0);

        expect(
          await prisma.saleItem.count(),
        ).toBe(0);
      },
    );

    it(
      "returns 400 for duplicate product IDs",
      async () => {
        const {
          user,
          token,
          firstProduct,
        } =
          await createSaleFixtures();

        await addStock(
          user.id,
          firstProduct.id,
          10,
        );

        await request(app)
          .post(
            "/api/sales",
          )
          .set(
            "Authorization",
            `Bearer ${token}`,
          )
          .send({
            paymentMethod:
              "CASH",

            items: [
              {
                productId:
                  firstProduct.id,

                quantity: 1,
              },
              {
                productId:
                  firstProduct.id,

                quantity: 2,
              },
            ],
          })
          .expect(400);

        expect(
          await prisma.sale.count(),
        ).toBe(0);

        expect(
          await prisma.saleItem.count(),
        ).toBe(0);
      },
    );

    it(
      "rejects a previously valid token after the user becomes inactive",
      async () => {
        const {
          user,
          token,
          firstProduct,
        } =
          await createSaleFixtures();

        await addStock(
          user.id,
          firstProduct.id,
          5,
        );

        await prisma.user.update({
          where: {
            id:
              user.id,
          },

          data: {
            active: false,
          },
        });

        await request(app)
          .post(
            "/api/sales",
          )
          .set(
            "Authorization",
            `Bearer ${token}`,
          )
          .send({
            paymentMethod:
              "CASH",

            items: [
              {
                productId:
                  firstProduct.id,

                quantity: 1,
              },
            ],
          })
          .expect(401);

        expect(
          await prisma.sale.count(),
        ).toBe(0);
      },
    );

    it(
      "rejects an inactive product",
      async () => {
        const {
          user,
          token,
          firstProduct,
        } =
          await createSaleFixtures();

        await addStock(
          user.id,
          firstProduct.id,
          5,
        );

        await prisma.product.update({
          where: {
            id:
              firstProduct.id,
          },

          data: {
            active: false,
          },
        });

        await request(app)
          .post(
            "/api/sales",
          )
          .set(
            "Authorization",
            `Bearer ${token}`,
          )
          .send({
            paymentMethod:
              "CASH",

            items: [
              {
                productId:
                  firstProduct.id,

                quantity: 1,
              },
            ],
          })
          .expect(400);

        expect(
          await prisma.sale.count(),
        ).toBe(0);

        expect(
          await getCurrentStock(
            firstProduct.id,
          ),
        ).toBe(5);
      },
    );

    it(
      "rejects insufficient stock without persisting sale state",
      async () => {
        const {
          user,
          token,
          firstProduct,
          secondProduct,
        } =
          await createSaleFixtures();

        await addStock(
          user.id,
          firstProduct.id,
          5,
        );

        await addStock(
          user.id,
          secondProduct.id,
          1,
        );

        const firstStockBefore =
          await getCurrentStock(
            firstProduct.id,
          );

        const secondStockBefore =
          await getCurrentStock(
            secondProduct.id,
          );

        const saleCountBefore =
          await prisma.sale.count();

        const saleItemCountBefore =
          await prisma.saleItem.count();

        const saleMovementCountBefore =
          await prisma.stockMovement.count({
            where: {
              type:
                StockMovementType.SALE,
            },
          });

        await request(app)
          .post(
            "/api/sales",
          )
          .set(
            "Authorization",
            `Bearer ${token}`,
          )
          .send({
            paymentMethod:
              "GCASH",

            items: [
              {
                productId:
                  firstProduct.id,

                quantity: 2,
              },
              {
                productId:
                  secondProduct.id,

                quantity: 2,
              },
            ],
          })
          .expect(400);

        expect(
          await prisma.sale.count(),
        ).toBe(
          saleCountBefore,
        );

        expect(
          await prisma.saleItem.count(),
        ).toBe(
          saleItemCountBefore,
        );

        expect(
          await prisma.stockMovement.count(
            {
              where: {
                type:
                  StockMovementType.SALE,
              },
            },
          ),
        ).toBe(
          saleMovementCountBefore,
        );

        expect(
          await getCurrentStock(
            firstProduct.id,
          ),
        ).toBe(
          firstStockBefore,
        );

        expect(
          await getCurrentStock(
            secondProduct.id,
          ),
        ).toBe(
          secondStockBefore,
        );
      },
    );

    it(
      "rejects attempted caller-supplied money fields at the API boundary",
      async () => {
        const {
          user,
          token,
          firstProduct,
        } =
          await createSaleFixtures();

        await addStock(
          user.id,
          firstProduct.id,
          5,
        );

        const response =
          await request(app)
            .post(
              "/api/sales",
            )
            .set(
              "Authorization",
              `Bearer ${token}`,
            )
            .send({
              paymentMethod:
                "CASH",

              totalAmount:
                "0.01",

              items: [
                {
                  productId:
                    firstProduct.id,

                  quantity: 2,

                  unitPrice:
                    "0.01",

                  lineTotal:
                    "0.02",
                },
              ],
            })
            .expect(400);

        expect(
          response.body.error,
        ).toBe(
          "Invalid sale request.",
        );

        expect(
          await prisma.sale.count(),
        ).toBe(0);
      },
    );

    it(
      "uses authoritative Product pricing when no caller money fields are supplied",
      async () => {
        const {
          user,
          token,
          firstProduct,
        } =
          await createSaleFixtures();

        await addStock(
          user.id,
          firstProduct.id,
          5,
        );

        const response =
          await request(app)
            .post(
              "/api/sales",
            )
            .set(
              "Authorization",
              `Bearer ${token}`,
            )
            .send({
              paymentMethod:
                "MAYA",

              items: [
                {
                  productId:
                    firstProduct.id,

                  quantity: 2,
                },
              ],
            })
            .expect(201);

        const saleItem =
          await prisma.saleItem.findFirst(
            {
              where: {
                saleId:
                  response.body.id,
              },
            },
          );

        expect(
          saleItem,
        ).not.toBeNull();

        expect(
          saleItem
            ?.unitPrice
            .toString(),
        ).toBe(
          firstProduct
            .sellingPrice
            .toString(),
        );

        expect(
          saleItem
            ?.lineTotal
            .toString(),
        ).toBe(
          firstProduct
            .sellingPrice
            .mul(2)
            .toString(),
        );
      },
    );

    it(
      "allows exactly one concurrent HTTP sale of the final unit",
      async () => {
        const {
          user,
          token,
          firstProduct,
        } =
          await createSaleFixtures();

        await addStock(
          user.id,
          firstProduct.id,
          1,
        );

        expect(
          await getCurrentStock(
            firstProduct.id,
          ),
        ).toBe(1);

        const saleCountBefore =
          await prisma.sale.count();

        const saleMovementCountBefore =
          await prisma.stockMovement.count({
            where: {
              type:
                StockMovementType.SALE,
            },
          });

        const body = {
          paymentMethod:
            PaymentMethod.CASH,

          items: [
            {
              productId:
                firstProduct.id,

              quantity: 1,
            },
          ],
        };

        const [
          firstResponse,
          secondResponse,
        ] =
          await Promise.all([
            request(app)
              .post(
                "/api/sales",
              )
              .set(
                "Authorization",
                `Bearer ${token}`,
              )
              .send(body),

            request(app)
              .post(
                "/api/sales",
              )
              .set(
                "Authorization",
                `Bearer ${token}`,
              )
              .send(body),
          ]);

        const statuses = [
          firstResponse.status,
          secondResponse.status,
        ].sort();

        expect(
          statuses,
        ).toEqual([
          201,
          400,
        ]);

        expect(
          await prisma.sale.count(),
        ).toBe(
          saleCountBefore +
            1,
        );

        expect(
          await prisma.stockMovement.count(
            {
              where: {
                type:
                  StockMovementType.SALE,
              },
            },
          ),
        ).toBe(
          saleMovementCountBefore +
            1,
        );

        expect(
          await getCurrentStock(
            firstProduct.id,
          ),
        ).toBe(0);

        const rejectedResponse =
          firstResponse.status ===
          400
            ? firstResponse
            : secondResponse;

        expect(
          rejectedResponse
            .body.error,
        ).toContain(
          "Insufficient stock",
        );
      },
    );
  },
);