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
  UserRole,
} from "../../generated/prisma/client.js";

import { app } from "../app.js";
import { prisma } from "../db/prisma.js";
import { getCurrentStock } from "../repositories/product.repository.js";
import { recordStockAdjustment } from "../services/stock-adjustment.service.js";

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

async function createAuthFixtures() {
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
        name: "Auth Owner",
        email:
          "auth-owner@test.local",
        passwordHash:
          ownerPasswordHash,
        role: UserRole.OWNER,
        active: true,
      },
    });

  const staff =
    await prisma.user.create({
      data: {
        name: "Auth Staff",
        email:
          "auth-staff@test.local",
        passwordHash:
          staffPasswordHash,
        role: UserRole.STAFF,
        active: true,
      },
    });

  const product =
    await prisma.product.create({
      data: {
        sku: "AUTH-001",
        name:
          "Auth Test Product",
        category: "Testing",
        sellingPrice: "20.00",
        reorderLevel: 2,
        active: true,
      },
    });

  return {
    owner,
    staff,
    product,
  };
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

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

describe(
  "POST /api/auth/login",
  () => {
    it("returns 200 and a token for valid credentials", async () => {
      const { owner } =
        await createAuthFixtures();

      const response =
        await request(app)
          .post(
            "/api/auth/login",
          )
          .send({
            email: owner.email,
            password:
              OWNER_PASSWORD,
          })
          .expect(200);

      expect(
        response.body.token,
      ).toEqual(
        expect.any(String),
      );

      expect(
        response.body.user,
      ).toEqual({
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: UserRole.OWNER,
      });
    });

    it("returns 401 for a wrong password", async () => {
      const { owner } =
        await createAuthFixtures();

      await request(app)
        .post("/api/auth/login")
        .send({
          email: owner.email,
          password:
            "DefinitelyWrong123!",
        })
        .expect(401);
    });

    it("returns 401 for an unknown email", async () => {
      await createAuthFixtures();

      await request(app)
        .post("/api/auth/login")
        .send({
          email:
            "missing@test.local",
          password:
            OWNER_PASSWORD,
        })
        .expect(401);
    });

    it("returns 403 for an inactive user", async () => {
      const { staff } =
        await createAuthFixtures();

      await prisma.user.update({
        where: {
          id: staff.id,
        },
        data: {
          active: false,
        },
      });

      await request(app)
        .post("/api/auth/login")
        .send({
          email: staff.email,
          password:
            STAFF_PASSWORD,
        })
        .expect(403);
    });

    it("returns 400 for a malformed login body", async () => {
      await request(app)
        .post("/api/auth/login")
        .send({
          email: "not-an-email",
          password: "",
        })
        .expect(400);
    });
  },
);

describe(
  "authentication middleware",
  () => {
    it("returns 401 when a protected route has no token", async () => {
      await createAuthFixtures();

      await request(app)
        .get("/api/products")
        .expect(401);
    });

    it("returns 401 for an invalid token", async () => {
      await createAuthFixtures();

      await request(app)
        .get("/api/products")
        .set(
          "Authorization",
          "Bearer definitely-not-valid",
        )
        .expect(401);
    });

    it("rejects a previously valid token after the user is deactivated", async () => {
      const { owner } =
        await createAuthFixtures();

      const token = await login(
        owner.email,
        OWNER_PASSWORD,
      );

      await prisma.user.update({
        where: {
          id: owner.id,
        },
        data: {
          active: false,
        },
      });

      await request(app)
        .get("/api/products")
        .set(
          "Authorization",
          `Bearer ${token}`,
        )
        .expect(401);
    });
  },
);

describe(
  "role-based access control",
  () => {
    it("allows STAFF to read products", async () => {
      const { staff } =
        await createAuthFixtures();

      const token = await login(
        staff.email,
        STAFF_PASSWORD,
      );

      await request(app)
        .get("/api/products")
        .set(
          "Authorization",
          `Bearer ${token}`,
        )
        .expect(200);
    });

    it("allows STAFF to record a sale", async () => {
      const {
        owner,
        staff,
        product,
      } =
        await createAuthFixtures();

      await recordStockAdjustment({
        productId:
          product.id,
        quantityDelta: 5,
        reason:
          "Prepare stock for auth test",
        adjustedBy:
          owner.id,
      });

      const staffToken =
        await login(
          staff.email,
          STAFF_PASSWORD,
        );

      const response =
        await request(app)
          .post("/api/sales")
          .set(
            "Authorization",
            `Bearer ${staffToken}`,
          )
          .send({
            paymentMethod:
              "CASH",

            items: [
              {
                productId:
                  product.id,
                quantity: 1,
              },
            ],
          })
          .expect(201);

      const sale =
        await prisma.sale.findUnique({
          where: {
            id: response.body.id,
          },
        });

      expect(
        sale,
      ).not.toBeNull();

      /*
       * Critical trust-boundary assertion:
       * recordedBy comes from the authenticated
       * STAFF token.
       */
      expect(
        sale?.recordedBy,
      ).toBe(staff.id);

      expect(
        await getCurrentStock(
          product.id,
        ),
      ).toBe(4);
    });

    it("returns 403 when STAFF attempts a stock adjustment", async () => {
      const {
        staff,
        product,
      } =
        await createAuthFixtures();

      const staffToken =
        await login(
          staff.email,
          STAFF_PASSWORD,
        );

      await request(app)
        .post(
          "/api/adjustments",
        )
        .set(
          "Authorization",
          `Bearer ${staffToken}`,
        )
        .send({
          productId:
            product.id,
          quantityDelta: 3,
          reason:
            "Staff should not be allowed",
        })
        .expect(403);

      expect(
        await prisma.stockAdjustment.count(),
      ).toBe(0);
    });

    it("allows OWNER to create a stock adjustment and records the authenticated owner as actor", async () => {
      const {
        owner,
        product,
      } =
        await createAuthFixtures();

      const ownerToken =
        await login(
          owner.email,
          OWNER_PASSWORD,
        );

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
              "Owner adjustment",
          })
          .expect(201);

      const adjustment =
        await prisma.stockAdjustment.findUnique(
          {
            where: {
              id:
                response.body.id,
            },
          },
        );

      expect(
        adjustment,
      ).not.toBeNull();

      expect(
        adjustment?.adjustedBy,
      ).toBe(owner.id);

      const movement =
        await prisma.stockMovement.findUnique(
          {
            where: {
              stockAdjustmentId:
                adjustment!.id,
            },
          },
        );

      expect(
        movement?.actorId,
      ).toBe(owner.id);
    });
  },
);