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

const TEST_PASSWORD =
  "TestPassword123!";

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
): Promise<string> {
  const response =
    await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password:
          TEST_PASSWORD,
      })
      .expect(200);

  return response.body
    .token as string;
}

async function createFixtures() {
  const passwordHash =
    await bcrypt.hash(
      TEST_PASSWORD,
      4,
    );

  const owner =
    await prisma.user.create({
      data: {
        name: "Product Owner",
        email:
          "product-owner@test.local",
        passwordHash,
        role:
          UserRole.OWNER,
        active: true,
      },
    });

  const staff =
    await prisma.user.create({
      data: {
        name: "Product Staff",
        email:
          "product-staff@test.local",
        passwordHash,
        role:
          UserRole.STAFF,
        active: true,
      },
    });

  const ownerToken =
    await login(owner.email);

  const staffToken =
    await login(staff.email);

  return {
    owner,
    staff,
    ownerToken,
    staffToken,
  };
}

function validProductBody() {
  return {
    sku: "COKE-1L",
    name: "Coke 1L",
    category: "Beverages",
    sellingPrice: "75.00",
    reorderLevel: 5,
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
  "POST /api/products",
  () => {
    it("allows OWNER to create a product", async () => {
      const {
        ownerToken,
      } =
        await createFixtures();

      const response =
        await request(app)
          .post("/api/products")
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .send(
            validProductBody(),
          )
          .expect(201);

      expect(
        response.body,
      ).toEqual({
        id: expect.any(Number),
        sku: "COKE-1L",
        name: "Coke 1L",
        category:
          "Beverages",
        sellingPrice: "75",
        reorderLevel: 5,
        active: true,
      });
    });

    it("returns 403 when STAFF creates a product", async () => {
      const {
        staffToken,
      } =
        await createFixtures();

      await request(app)
        .post("/api/products")
        .set(
          "Authorization",
          `Bearer ${staffToken}`,
        )
        .send(
          validProductBody(),
        )
        .expect(403);

      expect(
        await prisma.product.count(),
      ).toBe(0);
    });

    it("returns 401 when unauthenticated", async () => {
      await request(app)
        .post("/api/products")
        .send(
          validProductBody(),
        )
        .expect(401);

      expect(
        await prisma.product.count(),
      ).toBe(0);
    });

    it("creates the product active with current stock 0", async () => {
      const {
        ownerToken,
      } =
        await createFixtures();

      const created =
        await request(app)
          .post("/api/products")
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .send(
            validProductBody(),
          )
          .expect(201);

      expect(
        created.body.active,
      ).toBe(true);

      expect(
        await prisma.stockMovement.count(),
      ).toBe(0);

      const products =
        await request(app)
          .get("/api/products")
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .expect(200);

      const product =
        products.body.find(
          (item: {
            id: number;
          }) =>
            item.id ===
            created.body.id,
        );

      expect(
        product.currentStock,
      ).toBe(0);
    });

    it("rejects caller-supplied inventory fields", async () => {
      const {
        ownerToken,
      } =
        await createFixtures();

      await request(app)
        .post("/api/products")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          ...validProductBody(),
          currentStock: 500,
        })
        .expect(400);

      await request(app)
        .post("/api/products")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          ...validProductBody(),
          stock: 500,
        })
        .expect(400);

      expect(
        await prisma.product.count(),
      ).toBe(0);

      expect(
        await prisma.stockMovement.count(),
      ).toBe(0);
    });

    it("rejects invalid sellingPrice", async () => {
      const {
        ownerToken,
      } =
        await createFixtures();

      await request(app)
        .post("/api/products")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          ...validProductBody(),
          sellingPrice: "0.00",
        })
        .expect(400);

      await request(app)
        .post("/api/products")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          ...validProductBody(),
          sellingPrice: "12.345",
        })
        .expect(400);
    });

    it("rejects invalid reorderLevel", async () => {
      const {
        ownerToken,
      } =
        await createFixtures();

      await request(app)
        .post("/api/products")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          ...validProductBody(),
          reorderLevel: -1,
        })
        .expect(400);

      await request(app)
        .post("/api/products")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          ...validProductBody(),
          reorderLevel: 1.5,
        })
        .expect(400);
    });

    it("returns 409 for a duplicate SKU", async () => {
      const {
        ownerToken,
      } =
        await createFixtures();

      await request(app)
        .post("/api/products")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send(
          validProductBody(),
        )
        .expect(201);

      const response =
        await request(app)
          .post("/api/products")
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .send({
            ...validProductBody(),
            name:
              "Different Product",
          })
          .expect(409);

      expect(
        response.body.error,
      ).toContain(
        "already in use",
      );
    });
  },
);

describe(
  "PATCH /api/products/:id",
  () => {
    it("allows OWNER to update product fields", async () => {
      const {
        ownerToken,
      } =
        await createFixtures();

      const product =
        await prisma.product.create({
          data: {
            ...validProductBody(),
            active: true,
          },
        });

      const response =
        await request(app)
          .patch(
            `/api/products/${product.id}`,
          )
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .send({
            sku:
              "COKE-1L-NEW",
            name:
              "Coke 1 Liter",
            category:
              "Soft Drinks",
            sellingPrice:
              "85.00",
            reorderLevel: 8,
            active: false,
          })
          .expect(200);

      expect(
        response.body,
      ).toMatchObject({
        id: product.id,
        sku:
          "COKE-1L-NEW",
        name:
          "Coke 1 Liter",
        category:
          "Soft Drinks",
        sellingPrice: "85",
        reorderLevel: 8,
        active: false,
      });
    });

    it("uses PATCH semantics and leaves omitted fields unchanged", async () => {
      const {
        ownerToken,
      } =
        await createFixtures();

      const product =
        await prisma.product.create({
          data: {
            ...validProductBody(),
            active: true,
          },
        });

      await request(app)
        .patch(
          `/api/products/${product.id}`,
        )
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          sellingPrice:
            "85.00",
        })
        .expect(200);

      const updated =
        await prisma.product.findUniqueOrThrow({
          where: {
            id: product.id,
          },
        });

      expect(updated.sku).toBe(
        product.sku,
      );

      expect(updated.name).toBe(
        product.name,
      );

      expect(
        updated.category,
      ).toBe(
        product.category,
      );

      expect(
        updated.reorderLevel,
      ).toBe(
        product.reorderLevel,
      );

      expect(
        updated.active,
      ).toBe(true);

      expect(
        updated.sellingPrice.toString(),
      ).toBe("85");
    });

    it("allows category to be explicitly cleared with null", async () => {
      const {
        ownerToken,
      } =
        await createFixtures();

      const product =
        await prisma.product.create({
          data: {
            ...validProductBody(),
          },
        });

      const response =
        await request(app)
          .patch(
            `/api/products/${product.id}`,
          )
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .send({
            category: null,
          })
          .expect(200);

      expect(
        response.body.category,
      ).toBeNull();

      const updated =
        await prisma.product.findUniqueOrThrow({
          where: {
            id: product.id,
          },
        });

      expect(
        updated.category,
      ).toBeNull();
    });

    it("returns 409 when changing SKU to one already in use", async () => {
      const {
        ownerToken,
      } =
        await createFixtures();

      const first =
        await prisma.product.create({
          data: {
            ...validProductBody(),
          },
        });

      const second =
        await prisma.product.create({
          data: {
            sku: "OTHER-001",
            name:
              "Other Product",
            category: null,
            sellingPrice:
              "20.00",
            reorderLevel: 0,
          },
        });

      await request(app)
        .patch(
          `/api/products/${second.id}`,
        )
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          sku: first.sku,
        })
        .expect(409);
    });

    it("returns 403 when STAFF updates a product", async () => {
      const {
        staffToken,
      } =
        await createFixtures();

      const product =
        await prisma.product.create({
          data: {
            ...validProductBody(),
          },
        });

      await request(app)
        .patch(
          `/api/products/${product.id}`,
        )
        .set(
          "Authorization",
          `Bearer ${staffToken}`,
        )
        .send({
          name:
            "Unauthorized change",
        })
        .expect(403);

      const unchanged =
        await prisma.product.findUniqueOrThrow({
          where: {
            id: product.id,
          },
        });

      expect(
        unchanged.name,
      ).toBe(
        "Coke 1L",
      );
    });

    it("rejects caller-supplied stock during update", async () => {
      const {
        ownerToken,
      } =
        await createFixtures();

      const product =
        await prisma.product.create({
          data: {
            ...validProductBody(),
          },
        });

      await request(app)
        .patch(
          `/api/products/${product.id}`,
        )
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          currentStock: 50,
        })
        .expect(400);
    });
  },
);