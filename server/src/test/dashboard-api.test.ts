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

import {
  app,
} from "../app.js";

import {
  prisma,
} from "../db/prisma.js";

import {
  getDashboard,
} from "../services/dashboard.service.js";

import {
  recordStockAdjustment,
} from "../services/stock-adjustment.service.js";

import {
  getManilaDateString,
  getManilaDayRange,
} from "../utils/manila-business-day.js";

const OWNER_PASSWORD =
  "OwnerPassword123!";

const STAFF_PASSWORD =
  "StaffPassword123!";

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
        name:
          "Dashboard Owner",

        email:
          "dashboard-owner@test.local",

        passwordHash:
          ownerHash,

        role:
          UserRole.OWNER,

        active: true,
      },
    });

  const staff =
    await prisma.user.create({
      data: {
        name:
          "Dashboard Staff",

        email:
          "dashboard-staff@test.local",

        passwordHash:
          staffHash,

        role:
          UserRole.STAFF,

        active: true,
      },
    });

  const otherStaff =
    await prisma.user.create({
      data: {
        name:
          "Other Dashboard Staff",

        email:
          "dashboard-other@test.local",

        passwordHash:
          staffHash,

        role:
          UserRole.STAFF,

        active: true,
      },
    });

  return {
    owner,
    staff,
    otherStaff,
  };
}

async function login(
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

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

describe(
  "GET /api/dashboard",
  () => {
    it(
      "returns 401 when unauthenticated",
      async () => {
        await request(app)
          .get(
            "/api/dashboard",
          )
          .expect(401);
      },
    );

    it(
      "returns OWNER dashboard metrics and excludes inactive products",
      async () => {
        const {
          owner,
          staff,
        } =
          await createFixtures();

        /*
         * One inactive STAFF account should
         * not contribute to activeStaffCount.
         */
        await prisma.user.create({
          data: {
            name:
              "Inactive Staff",

            email:
              "inactive-dashboard@test.local",

            passwordHash:
              await bcrypt.hash(
                STAFF_PASSWORD,
                4,
              ),

            role:
              UserRole.STAFF,

            active: false,
          },
        });

        const lowProduct =
          await prisma.product.create({
            data: {
              sku:
                "LOW-001",

              name:
                "Low Product",

              category:
                null,

              sellingPrice:
                "25.00",

              reorderLevel:
                5,

              active: true,
            },
          });

        const healthyProduct =
          await prisma.product.create({
            data: {
              sku:
                "OK-001",

              name:
                "Healthy Product",

              category:
                null,

              sellingPrice:
                "50.00",

              reorderLevel:
                2,

              active: true,
            },
          });

        /*
         * Zero-stock inactive product.
         * It must not generate dashboard
         * low/out-of-stock attention.
         */
        await prisma.product.create({
          data: {
            sku:
              "INACTIVE-001",

            name:
              "Inactive Product",

            category:
              null,

            sellingPrice:
              "15.00",

            reorderLevel:
              100,

            active: false,
          },
        });

        /*
         * Stock comes only from movements.
         */
        await recordStockAdjustment({
          productId:
            lowProduct.id,

          quantityDelta: 2,

          reason:
            "Dashboard low-stock fixture",

          adjustedBy:
            owner.id,
        });

        await recordStockAdjustment({
          productId:
            healthyProduct.id,

          quantityDelta: 10,

          reason:
            "Dashboard healthy-stock fixture",

          adjustedBy:
            owner.id,
        });

        /*
         * Create sales inside the real current
         * Manila day so the API endpoint itself
         * can be tested deterministically.
         */
        const today =
          getManilaDateString();

        const {
          start,
        } =
          getManilaDayRange(
            today,
          );

        await prisma.sale.create({
          data: {
            recordedBy:
              staff.id,

            totalAmount:
              "120.50",

            paymentMethod:
              PaymentMethod.CASH,

            createdAt:
              new Date(
                start.getTime() +
                  60 *
                    60 *
                    1000,
              ),
          },
        });

        await prisma.sale.create({
          data: {
            recordedBy:
              staff.id,

            totalAmount:
              "80.00",

            paymentMethod:
              PaymentMethod.GCASH,

            createdAt:
              new Date(
                start.getTime() +
                  2 *
                    60 *
                    60 *
                    1000,
              ),
          },
        });

        const ownerToken =
          await login(
            owner.email,
            OWNER_PASSWORD,
          );

        const response =
          await request(app)
            .get(
              "/api/dashboard",
            )
            .set(
              "Authorization",
              `Bearer ${ownerToken}`,
            )
            .expect(200);

        expect(
          response.body.role,
        ).toBe(
          "OWNER",
        );

        expect(
          response.body.date,
        ).toBe(
          today,
        );

        expect(
          response.body.metrics,
        ).toEqual({
          salesCount: 2,

          totalSalesAmount:
            "200.5",

          lowStockCount: 1,

          outOfStockCount: 0,

          activeProductCount: 2,

          /*
           * staff + otherStaff are active.
           * OWNER is not counted.
           */
          activeStaffCount: 2,
        });

        expect(
          response.body
            .lowStockProducts,
        ).toEqual([
          {
            id:
              lowProduct.id,

            sku:
              lowProduct.sku,

            name:
              lowProduct.name,

            currentStock: 2,

            reorderLevel: 5,
          },
        ]);

        expect(
          response.body.metrics,
        ).not.toHaveProperty(
          "mySalesCount",
        );
      },
    );

    it(
      "returns STAFF dashboard containing only that staff member's sales count",
      async () => {
        const {
          owner,
          staff,
          otherStaff,
        } =
          await createFixtures();

        const lowProduct =
          await prisma.product.create({
            data: {
              sku:
                "STAFF-LOW",

              name:
                "Staff Low Product",

              sellingPrice:
                "10.00",

              reorderLevel:
                5,

              active: true,
            },
          });

        await recordStockAdjustment({
          productId:
            lowProduct.id,

          quantityDelta: 2,

          reason:
            "Staff dashboard fixture",

          adjustedBy:
            owner.id,
        });

        const today =
          getManilaDateString();

        const {
          start,
        } =
          getManilaDayRange(
            today,
          );

        /*
         * Two sales belong to the authenticated
         * STAFF member.
         */
        await prisma.sale.create({
          data: {
            recordedBy:
              staff.id,

            totalAmount:
              "100.00",

            paymentMethod:
              PaymentMethod.CASH,

            createdAt:
              new Date(
                start.getTime() +
                  60 *
                    60 *
                    1000,
              ),
          },
        });

        await prisma.sale.create({
          data: {
            recordedBy:
              staff.id,

            totalAmount:
              "150.00",

            paymentMethod:
              PaymentMethod.GCASH,

            createdAt:
              new Date(
                start.getTime() +
                  2 *
                    60 *
                    60 *
                    1000,
              ),
          },
        });

        /*
         * Another STAFF member's sale must not
         * contribute to mySalesCount.
         */
        await prisma.sale.create({
          data: {
            recordedBy:
              otherStaff.id,

            totalAmount:
              "5000.00",

            paymentMethod:
              PaymentMethod.CASH,

            createdAt:
              new Date(
                start.getTime() +
                  3 *
                    60 *
                    60 *
                    1000,
              ),
          },
        });

        const staffToken =
          await login(
            staff.email,
            STAFF_PASSWORD,
          );

        const response =
          await request(app)
            .get(
              "/api/dashboard",
            )
            .set(
              "Authorization",
              `Bearer ${staffToken}`,
            )
            .expect(200);

        expect(
          response.body.role,
        ).toBe(
          "STAFF",
        );

        expect(
          response.body.date,
        ).toBe(
          today,
        );

        expect(
          response.body.metrics
            .mySalesCount,
        ).toBe(2);

        expect(
          response.body.metrics
            .lowStockCount,
        ).toBe(1);

        expect(
          response.body.metrics
            .outOfStockCount,
        ).toBe(0);

        expect(
          response.body.metrics
            .activeProductCount,
        ).toBe(1);

        /*
         * STAFF must not gain OWNER financial
         * visibility through the dashboard.
         */
        expect(
          response.body.metrics,
        ).not.toHaveProperty(
          "totalSalesAmount",
        );

        expect(
          response.body.metrics,
        ).not.toHaveProperty(
          "salesCount",
        );

        expect(
          response.body.metrics,
        ).not.toHaveProperty(
          "activeStaffCount",
        );

        expect(
          response.body,
        ).not.toHaveProperty(
          "totalSalesAmount",
        );
      },
    );

    it(
      "works with zero products, sales, staff, and movements",
      async () => {
        const ownerHash =
          await bcrypt.hash(
            OWNER_PASSWORD,
            4,
          );

        const owner =
          await prisma.user.create({
            data: {
              name:
                "Fresh Owner",

              email:
                "fresh-dashboard@test.local",

              passwordHash:
                ownerHash,

              role:
                UserRole.OWNER,

              active: true,
            },
          });

        const ownerToken =
          await login(
            owner.email,
            OWNER_PASSWORD,
          );

        const response =
          await request(app)
            .get(
              "/api/dashboard",
            )
            .set(
              "Authorization",
              `Bearer ${ownerToken}`,
            )
            .expect(200);

        expect(
          response.body.role,
        ).toBe(
          "OWNER",
        );

        expect(
          response.body.metrics,
        ).toEqual({
          salesCount: 0,
          totalSalesAmount:
            "0",
          lowStockCount: 0,
          outOfStockCount: 0,
          activeProductCount: 0,
          activeStaffCount: 0,
        });

        expect(
          response.body
            .lowStockProducts,
        ).toEqual([]);
      },
    );
  },
);

describe(
  "dashboard Manila business day",
  () => {
    it(
      "places sales around the UTC boundary into the correct Philippine business date",
      async () => {
        const {
          owner,
          staff,
        } =
          await createFixtures();

        /*
         * 2026-09-30 15:59 UTC
         * =
         * 2026-09-30 23:59 Manila
         *
         * Not part of October 1.
         */
        await prisma.sale.create({
          data: {
            recordedBy:
              staff.id,

            totalAmount:
              "10.00",

            paymentMethod:
              PaymentMethod.CASH,

            createdAt:
              new Date(
                "2026-09-30T15:59:00.000Z",
              ),
          },
        });

        /*
         * 2026-09-30 16:01 UTC
         * =
         * 2026-10-01 00:01 Manila
         *
         * Part of October 1.
         */
        await prisma.sale.create({
          data: {
            recordedBy:
              staff.id,

            totalAmount:
              "20.00",

            paymentMethod:
              PaymentMethod.CASH,

            createdAt:
              new Date(
                "2026-09-30T16:01:00.000Z",
              ),
          },
        });

        /*
         * Any instant during October 1
         * Manila time works here.
         */
        const dashboard =
          await getDashboard(
            {
              userId:
                owner.id,

              role:
                UserRole.OWNER,
            },

            new Date(
              "2026-10-01T04:00:00.000Z",
            ),
          );

        expect(
          dashboard.role,
        ).toBe(
          UserRole.OWNER,
        );

        expect(
          dashboard.date,
        ).toBe(
          "2026-10-01",
        );

        if (
          dashboard.role !==
          UserRole.OWNER
        ) {
          throw new Error(
            "Expected OWNER dashboard.",
          );
        }

        expect(
          dashboard.metrics
            .salesCount,
        ).toBe(1);

        expect(
          dashboard.metrics
            .totalSalesAmount,
        ).toBe(
          "20",
        );
      },
    );
  },
);