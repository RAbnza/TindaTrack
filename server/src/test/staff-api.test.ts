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
        name: "Staff Owner",
        email:
          "staff-owner@test.local",

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
          "Existing Staff",

        email:
          "existing-staff@test.local",

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
  "GET /api/staff",
  () => {
    it("allows OWNER to list STAFF accounts only", async () => {
      const {
        owner,
        staff,
      } =
        await createFixtures();

      const ownerToken =
        await login(
          owner.email,
          OWNER_PASSWORD,
        );

      const response =
        await request(app)
          .get("/api/staff")
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .expect(200);

      expect(
        response.body,
      ).toHaveLength(1);

      expect(
        response.body[0],
      ).toEqual({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        active: true,

        createdAt:
          staff.createdAt.toISOString(),
      });

      expect(
        response.body[0],
      ).not.toHaveProperty(
        "passwordHash",
      );

      expect(
        response.body.some(
          (user: {
            id: number;
          }) =>
            user.id ===
            owner.id,
        ),
      ).toBe(false);
    });

    it("returns 403 for STAFF", async () => {
      const {
        staff,
      } =
        await createFixtures();

      const staffToken =
        await login(
          staff.email,
          STAFF_PASSWORD,
        );

      await request(app)
        .get("/api/staff")
        .set(
          "Authorization",
          `Bearer ${staffToken}`,
        )
        .expect(403);
    });

    it("returns 401 when unauthenticated", async () => {
      await request(app)
        .get("/api/staff")
        .expect(401);
    });
  },
);

describe(
  "POST /api/staff",
  () => {
    it("allows OWNER to create an active STAFF account with a hashed password", async () => {
      const {
        owner,
      } =
        await createFixtures();

      const ownerToken =
        await login(
          owner.email,
          OWNER_PASSWORD,
        );

      const password =
        "NewStaffPassword123!";

      const response =
        await request(app)
          .post("/api/staff")
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .send({
            name:
              "Juan Dela Cruz",

            email:
              "  JUAN@EXAMPLE.COM  ",

            password,
          })
          .expect(201);

      expect(
        response.body,
      ).toEqual({
        id: expect.any(Number),

        name:
          "Juan Dela Cruz",

        email:
          "juan@example.com",

        active: true,

        createdAt:
          expect.any(String),
      });

      expect(
        response.body,
      ).not.toHaveProperty(
        "passwordHash",
      );

      expect(
        response.body,
      ).not.toHaveProperty(
        "role",
      );

      const created =
        await prisma.user.findUniqueOrThrow(
          {
            where: {
              id:
                response.body.id,
            },
          },
        );

      expect(
        created.role,
      ).toBe(
        UserRole.STAFF,
      );

      expect(
        created.active,
      ).toBe(true);

      expect(
        created.passwordHash,
      ).not.toBe(
        password,
      );

      expect(
        await bcrypt.compare(
          password,
          created.passwordHash,
        ),
      ).toBe(true);
    });

    it("returns 409 for duplicate email", async () => {
      const {
        owner,
        staff,
      } =
        await createFixtures();

      const ownerToken =
        await login(
          owner.email,
          OWNER_PASSWORD,
        );

      await request(app)
        .post("/api/staff")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          name:
            "Duplicate",

          email:
            staff.email,

          password:
            "DuplicatePassword123!",
        })
        .expect(409);
    });

    it("returns 400 for invalid body", async () => {
      const {
        owner,
      } =
        await createFixtures();

      const ownerToken =
        await login(
          owner.email,
          OWNER_PASSWORD,
        );

      await request(app)
        .post("/api/staff")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          name: "   ",
          email:
            "not-an-email",

          password:
            "short",
        })
        .expect(400);
    });

    it("rejects caller-supplied role", async () => {
      const {
        owner,
      } =
        await createFixtures();

      const ownerToken =
        await login(
          owner.email,
          OWNER_PASSWORD,
        );

      await request(app)
        .post("/api/staff")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          name:
            "Unsafe Staff",

          email:
            "unsafe@test.local",

          password:
            "UnsafePassword123!",

          role:
            "OWNER",
        })
        .expect(400);
    });

    it("rejects caller-supplied active", async () => {
      const {
        owner,
      } =
        await createFixtures();

      const ownerToken =
        await login(
          owner.email,
          OWNER_PASSWORD,
        );

      await request(app)
        .post("/api/staff")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          name:
            "Unsafe Staff",

          email:
            "unsafe@test.local",

          password:
            "UnsafePassword123!",

          active: false,
        })
        .expect(400);
    });
  },
);

describe(
  "PATCH /api/staff/:id",
  () => {
    it("allows OWNER to partially update STAFF", async () => {
      const {
        owner,
        staff,
      } =
        await createFixtures();

      const ownerToken =
        await login(
          owner.email,
          OWNER_PASSWORD,
        );

      const response =
        await request(app)
          .patch(
            `/api/staff/${staff.id}`,
          )
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .send({
            name:
              "Updated Staff",
          })
          .expect(200);

      expect(
        response.body.name,
      ).toBe(
        "Updated Staff",
      );

      expect(
        response.body.email,
      ).toBe(
        staff.email,
      );

      expect(
        response.body.active,
      ).toBe(true);
    });

    it("normalizes updated email", async () => {
      const {
        owner,
        staff,
      } =
        await createFixtures();

      const ownerToken =
        await login(
          owner.email,
          OWNER_PASSWORD,
        );

      const response =
        await request(app)
          .patch(
            `/api/staff/${staff.id}`,
          )
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .send({
            email:
              "  NEW-EMAIL@EXAMPLE.COM  ",
          })
          .expect(200);

      expect(
        response.body.email,
      ).toBe(
        "new-email@example.com",
      );
    });

    it("returns 409 for duplicate updated email", async () => {
      const {
        owner,
        staff,
      } =
        await createFixtures();

      const secondStaff =
        await prisma.user.create({
          data: {
            name:
              "Second Staff",

            email:
              "second-staff@test.local",

            passwordHash:
              await bcrypt.hash(
                STAFF_PASSWORD,
                4,
              ),

            role:
              UserRole.STAFF,

            active: true,
          },
        });

      const ownerToken =
        await login(
          owner.email,
          OWNER_PASSWORD,
        );

      await request(app)
        .patch(
          `/api/staff/${secondStaff.id}`,
        )
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          email:
            staff.email,
        })
        .expect(409);
    });

    it("allows OWNER to deactivate and reactivate STAFF", async () => {
      const {
        owner,
        staff,
      } =
        await createFixtures();

      const ownerToken =
        await login(
          owner.email,
          OWNER_PASSWORD,
        );

      const deactivated =
        await request(app)
          .patch(
            `/api/staff/${staff.id}`,
          )
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .send({
            active: false,
          })
          .expect(200);

      expect(
        deactivated.body.active,
      ).toBe(false);

      const reactivated =
        await request(app)
          .patch(
            `/api/staff/${staff.id}`,
          )
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .send({
            active: true,
          })
          .expect(200);

      expect(
        reactivated.body.active,
      ).toBe(true);
    });

    it("returns 403 when STAFF updates another staff account", async () => {
      const {
        staff,
      } =
        await createFixtures();

      const secondStaff =
        await prisma.user.create({
          data: {
            name:
              "Second Staff",

            email:
              "second@test.local",

            passwordHash:
              await bcrypt.hash(
                STAFF_PASSWORD,
                4,
              ),

            role:
              UserRole.STAFF,

            active: true,
          },
        });

      const staffToken =
        await login(
          staff.email,
          STAFF_PASSWORD,
        );

      await request(app)
        .patch(
          `/api/staff/${secondStaff.id}`,
        )
        .set(
          "Authorization",
          `Bearer ${staffToken}`,
        )
        .send({
          name:
            "Unauthorized",
        })
        .expect(403);
    });

    it("returns 404 for nonexistent staff", async () => {
      const {
        owner,
      } =
        await createFixtures();

      const ownerToken =
        await login(
          owner.email,
          OWNER_PASSWORD,
        );

      await request(app)
        .patch(
          "/api/staff/999999999",
        )
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          name:
            "Missing",
        })
        .expect(404);
    });

    it("rejects an OWNER ID as a staff resource", async () => {
      const {
        owner,
      } =
        await createFixtures();

      const ownerToken =
        await login(
          owner.email,
          OWNER_PASSWORD,
        );

      await request(app)
        .patch(
          `/api/staff/${owner.id}`,
        )
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          name:
            "Must Not Change",
        })
        .expect(404);

      const unchangedOwner =
        await prisma.user.findUniqueOrThrow(
          {
            where: {
              id:
                owner.id,
            },
          },
        );

      expect(
        unchangedOwner.name,
      ).toBe(
        "Staff Owner",
      );
    });

    it("prevents deactivated STAFF from using protected APIs with an existing token", async () => {
      const {
        owner,
        staff,
      } =
        await createFixtures();

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

      await request(app)
        .patch(
          `/api/staff/${staff.id}`,
        )
        .set(
          "Authorization",
          `Bearer ${ownerToken}`,
        )
        .send({
          active: false,
        })
        .expect(200);

      /*
       * Same token that worked before
       * deactivation must now fail.
       */
      await request(app)
        .get("/api/products")
        .set(
          "Authorization",
          `Bearer ${staffToken}`,
        )
        .expect(401);
    });
  },
);