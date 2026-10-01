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

async function createUserFixtures() {
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
        name: "Supplier Test Owner",
        email:
          "supplier-owner@test.local",
        passwordHash:
          ownerPasswordHash,
        role: UserRole.OWNER,
        active: true,
      },
    });

  const staff =
    await prisma.user.create({
      data: {
        name: "Supplier Test Staff",
        email:
          "supplier-staff@test.local",
        passwordHash:
          staffPasswordHash,
        role: UserRole.STAFF,
        active: true,
      },
    });

  return {
    owner,
    staff,
  };
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

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

describe(
  "GET /api/suppliers",
  () => {
    it("returns 200 for OWNER", async () => {
      const { owner } =
        await createUserFixtures();

      const ownerToken =
        await login(
          owner.email,
          OWNER_PASSWORD,
        );

      await request(app)
        .get("/api/suppliers")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .expect(200);
    });

    it("returns 200 for STAFF", async () => {
      const { staff } =
        await createUserFixtures();

      const staffToken =
        await login(
          staff.email,
          STAFF_PASSWORD,
        );

      await request(app)
        .get("/api/suppliers")
        .set(
          "Authorization",
          `Bearer ${staffToken}`,
        )
        .expect(200);
    });

    it("returns 401 when unauthenticated", async () => {
      await request(app)
        .get("/api/suppliers")
        .expect(401);
    });

    it("returns only active suppliers ordered by name ascending", async () => {
      const { owner } =
        await createUserFixtures();

      const activeB =
        await prisma.supplier.create({
          data: {
            name: "Beta Supplier",
            active: true,
          },
        });

      await prisma.supplier.create({
        data: {
          name: "Hidden Supplier",
          active: false,
        },
      });

      const activeA =
        await prisma.supplier.create({
          data: {
            name: "Alpha Supplier",
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
          .get("/api/suppliers")
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .expect(200);

      expect(response.body).toEqual([
        {
          id: activeA.id,
          name: "Alpha Supplier",
        },
        {
          id: activeB.id,
          name: "Beta Supplier",
        },
      ]);

      expect(
        response.body.some(
          (supplier: {
            name: string;
          }) =>
            supplier.name ===
            "Hidden Supplier",
        ),
      ).toBe(false);
    });
  },
);