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
        name:
          "Supplier Test Owner",

        email:
          "supplier-owner@test.local",

        passwordHash:
          ownerPasswordHash,

        role:
          UserRole.OWNER,

        active: true,
      },
    });

  const staff =
    await prisma.user.create({
      data: {
        name:
          "Supplier Test Staff",

        email:
          "supplier-staff@test.local",

        passwordHash:
          staffPasswordHash,

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
  "GET /api/suppliers",
  () => {
    it(
      "returns 200 for OWNER",
      async () => {
        const {
          owner,
        } =
          await createUserFixtures();

        const ownerToken =
          await login(
            owner.email,
            OWNER_PASSWORD,
          );

        await request(app)
          .get(
            "/api/suppliers",
          )
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .expect(200);
      },
    );

    it(
      "returns 200 for STAFF",
      async () => {
        const {
          staff,
        } =
          await createUserFixtures();

        const staffToken =
          await login(
            staff.email,
            STAFF_PASSWORD,
          );

        await request(app)
          .get(
            "/api/suppliers",
          )
          .set(
            "Authorization",
            `Bearer ${staffToken}`,
          )
          .expect(200);
      },
    );

    it(
      "returns 401 when unauthenticated",
      async () => {
        await request(app)
          .get(
            "/api/suppliers",
          )
          .expect(401);
      },
    );

    it(
      "returns only active suppliers ordered by name ascending",
      async () => {
        const {
          owner,
        } =
          await createUserFixtures();

        const activeB =
          await prisma.supplier.create(
            {
              data: {
                name:
                  "Beta Supplier",
                active: true,
              },
            },
          );

        await prisma.supplier.create(
          {
            data: {
              name:
                "Hidden Supplier",
              active: false,
            },
          },
        );

        const activeA =
          await prisma.supplier.create(
            {
              data: {
                name:
                  "Alpha Supplier",
                active: true,
              },
            },
          );

        const ownerToken =
          await login(
            owner.email,
            OWNER_PASSWORD,
          );

        const response =
          await request(app)
            .get(
              "/api/suppliers",
            )
            .set(
              "Authorization",
              `Bearer ${ownerToken}`,
            )
            .expect(200);

        expect(
          response.body,
        ).toEqual([
          {
            id: activeA.id,
            name:
              "Alpha Supplier",
          },
          {
            id: activeB.id,
            name:
              "Beta Supplier",
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
      },
    );
  },
);

describe(
  "GET /api/suppliers/manage",
  () => {
    it(
      "allows OWNER to list active and inactive suppliers",
      async () => {
        const {
          owner,
        } =
          await createUserFixtures();

        const active =
          await prisma.supplier.create(
            {
              data: {
                name:
                  "Active Supplier",

                contactDetails:
                  "09170000001",

                active: true,
              },
            },
          );

        const inactive =
          await prisma.supplier.create(
            {
              data: {
                name:
                  "Inactive Supplier",

                contactDetails:
                  null,

                active: false,
              },
            },
          );

        const ownerToken =
          await login(
            owner.email,
            OWNER_PASSWORD,
          );

        const response =
          await request(app)
            .get(
              "/api/suppliers/manage",
            )
            .set(
              "Authorization",
              `Bearer ${ownerToken}`,
            )
            .expect(200);

        expect(
          response.body,
        ).toEqual(
          expect.arrayContaining([
            {
              id: active.id,

              name:
                "Active Supplier",

              contactDetails:
                "09170000001",

              active: true,
            },

            {
              id:
                inactive.id,

              name:
                "Inactive Supplier",

              contactDetails:
                null,

              active: false,
            },
          ]),
        );
      },
    );

    it(
      "returns 403 for STAFF",
      async () => {
        const {
          staff,
        } =
          await createUserFixtures();

        const staffToken =
          await login(
            staff.email,
            STAFF_PASSWORD,
          );

        await request(app)
          .get(
            "/api/suppliers/manage",
          )
          .set(
            "Authorization",
            `Bearer ${staffToken}`,
          )
          .expect(403);
      },
    );

    it(
      "returns 401 when unauthenticated",
      async () => {
        await request(app)
          .get(
            "/api/suppliers/manage",
          )
          .expect(401);
      },
    );
  },
);

describe(
  "POST /api/suppliers",
  () => {
    it(
      "allows OWNER to create an active supplier",
      async () => {
        const {
          owner,
        } =
          await createUserFixtures();

        const ownerToken =
          await login(
            owner.email,
            OWNER_PASSWORD,
          );

        const response =
          await request(app)
            .post(
              "/api/suppliers",
            )
            .set(
              "Authorization",
              `Bearer ${ownerToken}`,
            )
            .send({
              name:
                "ABC Wholesale",

              contactDetails:
                "09171234567",
            })
            .expect(201);

        expect(
          response.body,
        ).toEqual({
          id:
            expect.any(
              Number,
            ),

          name:
            "ABC Wholesale",

          contactDetails:
            "09171234567",

          active: true,
        });

        const supplier =
          await prisma.supplier.findUnique(
            {
              where: {
                id:
                  response.body.id,
              },
            },
          );

        expect(
          supplier,
        ).not.toBeNull();

        expect(
          supplier?.active,
        ).toBe(true);
      },
    );

    it(
      "returns 403 when STAFF creates a supplier",
      async () => {
        const {
          staff,
        } =
          await createUserFixtures();

        const staffToken =
          await login(
            staff.email,
            STAFF_PASSWORD,
          );

        await request(app)
          .post(
            "/api/suppliers",
          )
          .set(
            "Authorization",
            `Bearer ${staffToken}`,
          )
          .send({
            name:
              "Forbidden Supplier",
          })
          .expect(403);

        expect(
          await prisma.supplier.count(),
        ).toBe(0);
      },
    );

    it(
      "rejects unknown request fields",
      async () => {
        const {
          owner,
        } =
          await createUserFixtures();

        const ownerToken =
          await login(
            owner.email,
            OWNER_PASSWORD,
          );

        await request(app)
          .post(
            "/api/suppliers",
          )
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .send({
            name:
              "ABC Wholesale",

            /*
             * active is server-owned
             * during creation.
             */
            active: false,
          })
          .expect(400);

        expect(
          await prisma.supplier.count(),
        ).toBe(0);
      },
    );
  },
);

describe(
  "PATCH /api/suppliers/:id",
  () => {
    it(
      "allows OWNER to partially update a supplier",
      async () => {
        const {
          owner,
        } =
          await createUserFixtures();

        const supplier =
          await prisma.supplier.create(
            {
              data: {
                name:
                  "Original Name",

                contactDetails:
                  "Old contact",

                active: true,
              },
            },
          );

        const ownerToken =
          await login(
            owner.email,
            OWNER_PASSWORD,
          );

        const response =
          await request(app)
            .patch(
              `/api/suppliers/${supplier.id}`,
            )
            .set(
              "Authorization",
              `Bearer ${ownerToken}`,
            )
            .send({
              name:
                "Updated Name",
            })
            .expect(200);

        expect(
          response.body.name,
        ).toBe(
          "Updated Name",
        );

        /*
         * Omitted PATCH fields remain
         * unchanged.
         */
        expect(
          response.body
            .contactDetails,
        ).toBe(
          "Old contact",
        );

        expect(
          response.body.active,
        ).toBe(true);
      },
    );

    it(
      "clears contactDetails with null",
      async () => {
        const {
          owner,
        } =
          await createUserFixtures();

        const supplier =
          await prisma.supplier.create(
            {
              data: {
                name:
                  "Supplier",

                contactDetails:
                  "09171234567",

                active: true,
              },
            },
          );

        const ownerToken =
          await login(
            owner.email,
            OWNER_PASSWORD,
          );

        const response =
          await request(app)
            .patch(
              `/api/suppliers/${supplier.id}`,
            )
            .set(
              "Authorization",
              `Bearer ${ownerToken}`,
            )
            .send({
              contactDetails:
                null,
            })
            .expect(200);

        expect(
          response.body
            .contactDetails,
        ).toBeNull();

        const updated =
          await prisma.supplier.findUniqueOrThrow(
            {
              where: {
                id:
                  supplier.id,
              },
            },
          );

        expect(
          updated.contactDetails,
        ).toBeNull();
      },
    );

    it(
      "allows supplier deactivation and reactivation",
      async () => {
        const {
          owner,
        } =
          await createUserFixtures();

        const supplier =
          await prisma.supplier.create(
            {
              data: {
                name:
                  "Lifecycle Supplier",

                active: true,
              },
            },
          );

        const ownerToken =
          await login(
            owner.email,
            OWNER_PASSWORD,
          );

        const deactivated =
          await request(app)
            .patch(
              `/api/suppliers/${supplier.id}`,
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
          deactivated.body
            .active,
        ).toBe(false);

        const reactivated =
          await request(app)
            .patch(
              `/api/suppliers/${supplier.id}`,
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
          reactivated.body
            .active,
        ).toBe(true);
      },
    );

    it(
      "returns 403 when STAFF updates a supplier",
      async () => {
        const {
          staff,
        } =
          await createUserFixtures();

        const supplier =
          await prisma.supplier.create(
            {
              data: {
                name:
                  "Protected Supplier",

                active: true,
              },
            },
          );

        const staffToken =
          await login(
            staff.email,
            STAFF_PASSWORD,
          );

        await request(app)
          .patch(
            `/api/suppliers/${supplier.id}`,
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

        const unchanged =
          await prisma.supplier.findUniqueOrThrow(
            {
              where: {
                id:
                  supplier.id,
              },
            },
          );

        expect(
          unchanged.name,
        ).toBe(
          "Protected Supplier",
        );
      },
    );

    it(
      "returns 404 for a nonexistent supplier",
      async () => {
        const {
          owner,
        } =
          await createUserFixtures();

        const ownerToken =
          await login(
            owner.email,
            OWNER_PASSWORD,
          );

        await request(app)
          .patch(
            "/api/suppliers/999999999",
          )
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .send({
            name:
              "Missing Supplier",
          })
          .expect(404);
      },
    );

    it(
      "keeps inactive suppliers out of the operational list",
      async () => {
        const {
          owner,
        } =
          await createUserFixtures();

        const supplier =
          await prisma.supplier.create(
            {
              data: {
                name:
                  "Deactivate Me",

                active: true,
              },
            },
          );

        const ownerToken =
          await login(
            owner.email,
            OWNER_PASSWORD,
          );

        await request(app)
          .patch(
            `/api/suppliers/${supplier.id}`,
          )
          .set(
            "Authorization",
            `Bearer ${ownerToken}`,
          )
          .send({
            active: false,
          })
          .expect(200);

        const operational =
          await request(app)
            .get(
              "/api/suppliers",
            )
            .set(
              "Authorization",
              `Bearer ${ownerToken}`,
            )
            .expect(200);

        expect(
          operational.body.some(
            (item: {
              id: number;
            }) =>
              item.id ===
              supplier.id,
          ),
        ).toBe(false);
      },
    );
  },
);