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

import {
  app,
} from "../app.js";

import {
  prisma,
} from "../db/prisma.js";

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

async function createExistingUser() {
  const passwordHash =
    await bcrypt.hash(
      "ExistingPassword123!",
      4,
    );

  return prisma.user.create({
    data: {
      name: "Existing Owner",
      email:
        "existing@test.local",
      passwordHash,
      role: UserRole.OWNER,
      active: true,
    },
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
  "GET /api/setup/status",
  () => {
    it("returns setupRequired true when no users exist", async () => {
      const response =
        await request(app)
          .get(
            "/api/setup/status",
          )
          .expect(200);

      expect(
        response.body,
      ).toEqual({
        setupRequired: true,
      });
    });

    it("returns setupRequired false after a user exists", async () => {
      await createExistingUser();

      const response =
        await request(app)
          .get(
            "/api/setup/status",
          )
          .expect(200);

      expect(
        response.body,
      ).toEqual({
        setupRequired: false,
      });
    });
  },
);

describe(
  "POST /api/setup",
  () => {
    it("creates exactly one active OWNER", async () => {
      const response =
        await request(app)
          .post("/api/setup")
          .send({
            name:
              "  Initial Owner  ",

            email:
              "  OWNER@EXAMPLE.COM  ",

            password:
              "SecurePassword123!",
          })
          .expect(201);

      expect(
        response.body,
      ).toEqual({
        id: expect.any(Number),
        name: "Initial Owner",
        email:
          "owner@example.com",
        role: UserRole.OWNER,
        active: true,
      });

      expect(
        await prisma.user.count(),
      ).toBe(1);

      const owner =
        await prisma.user.findFirst();

      expect(owner).not.toBeNull();

      expect(
        owner?.role,
      ).toBe(
        UserRole.OWNER,
      );

      expect(
        owner?.active,
      ).toBe(true);
    });

    it("stores a password hash instead of plaintext", async () => {
      const password =
        "SecurePassword123!";

      await request(app)
        .post("/api/setup")
        .send({
          name: "Initial Owner",
          email:
            "owner@example.com",
          password,
        })
        .expect(201);

      const owner =
        await prisma.user.findUnique({
          where: {
            email:
              "owner@example.com",
          },
        });

      expect(owner).not.toBeNull();

      expect(
        owner?.passwordHash,
      ).not.toBe(password);

      expect(
        await bcrypt.compare(
          password,
          owner!.passwordHash,
        ),
      ).toBe(true);
    });

    it("returns 400 for a malformed setup body", async () => {
      await request(app)
        .post("/api/setup")
        .send({
          name: "   ",
          email: "not-an-email",
          password: "short",
          role: "OWNER",
        })
        .expect(400);

      expect(
        await prisma.user.count(),
      ).toBe(0);
    });

    it("returns 409 for a second setup attempt", async () => {
      await request(app)
        .post("/api/setup")
        .send({
          name: "First Owner",
          email:
            "first@example.com",
          password:
            "FirstPassword123!",
        })
        .expect(201);

      const response =
        await request(app)
          .post("/api/setup")
          .send({
            name:
              "Second Owner",
            email:
              "second@example.com",
            password:
              "SecondPassword123!",
          })
          .expect(409);

      expect(
        response.body.error,
      ).toBe(
        "Initial setup has already been completed.",
      );

      expect(
        await prisma.user.count(),
      ).toBe(1);
    });

    it("allows exactly one concurrent setup request to succeed", async () => {
      const [
        firstResponse,
        secondResponse,
      ] = await Promise.all([
        request(app)
          .post("/api/setup")
          .send({
            name:
              "Concurrent Owner A",
            email:
              "owner-a@example.com",
            password:
              "ConcurrentPasswordA123!",
          }),

        request(app)
          .post("/api/setup")
          .send({
            name:
              "Concurrent Owner B",
            email:
              "owner-b@example.com",
            password:
              "ConcurrentPasswordB123!",
          }),
      ]);

      const statuses = [
        firstResponse.status,
        secondResponse.status,
      ].sort(
        (a, b) => a - b,
      );

      expect(
        statuses,
      ).toEqual([
        201,
        409,
      ]);

      expect(
        await prisma.user.count(),
      ).toBe(1);

      expect(
        await prisma.user.count({
          where: {
            role:
              UserRole.OWNER,
          },
        }),
      ).toBe(1);

      const owner =
        await prisma.user.findFirst();

      expect(
        owner?.active,
      ).toBe(true);
    });
  },
);