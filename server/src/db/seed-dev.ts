import bcrypt from "bcryptjs";
import "dotenv/config";

import {
  UserRole,
} from "../../generated/prisma/client.js";

import { prisma } from "./prisma.js";
import { recordStockReceipt } from "../services/stock-receipt.service.js";

const OWNER_EMAIL =
  "owner@tindatrack.dev";

const OWNER_PASSWORD =
  "Owner123!";

const STAFF_EMAIL =
  "staff@tindatrack.dev";

const STAFF_PASSWORD =
  "Staff123!";

const DEV_SUPPLIER_NAME =
  "Development Wholesale Supplier";

const DEV_RECEIPT_REFERENCE =
  "DEV-SEED-RECEIPT-001";

async function getOrCreateSupplier() {
  const existingSupplier =
    await prisma.supplier.findFirst({
      where: {
        name: DEV_SUPPLIER_NAME,
      },
    });

  if (existingSupplier) {
    return existingSupplier;
  }

  return prisma.supplier.create({
    data: {
      name:
        DEV_SUPPLIER_NAME,

      contactDetails:
        "09170000001",

      active:
        true,
    },
  });
}

async function getOrCreateProduct(
  input: {
    sku: string;
    name: string;
    category: string;
    sellingPrice: string;
    reorderLevel: number;
  },
) {
  return prisma.product.upsert({
    where: {
      sku:
        input.sku,
    },

    update: {
      name:
        input.name,

      category:
        input.category,

      sellingPrice:
        input.sellingPrice,

      reorderLevel:
        input.reorderLevel,

      active:
        true,
    },

    create: {
      sku:
        input.sku,

      name:
        input.name,

      category:
        input.category,

      sellingPrice:
        input.sellingPrice,

      reorderLevel:
        input.reorderLevel,

      active:
        true,
    },
  });
}

async function seedDevelopmentDatabase(): Promise<void> {
  const databaseUrl =
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required.",
    );
  }

  const databaseName =
    new URL(
      databaseUrl,
    ).pathname.replace(
      /^\//,
      "",
    );

  if (
    databaseName.endsWith(
      "_test",
    )
  ) {
    throw new Error(
      `Refusing to seed test database "${databaseName}" with development seed data.`,
    );
  }

  console.log(
    `Seeding development database "${databaseName}"...`,
  );

  const ownerPasswordHash =
    await bcrypt.hash(
      OWNER_PASSWORD,
      10,
    );

  const staffPasswordHash =
    await bcrypt.hash(
      STAFF_PASSWORD,
      10,
    );

  const owner =
    await prisma.user.upsert({
      where: {
        email:
          OWNER_EMAIL,
      },

      update: {
        name:
          "Development Owner",

        passwordHash:
          ownerPasswordHash,

        role:
          UserRole.OWNER,

        active:
          true,
      },

      create: {
        name:
          "Development Owner",

        email:
          OWNER_EMAIL,

        passwordHash:
          ownerPasswordHash,

        role:
          UserRole.OWNER,

        active:
          true,
      },
    });

  const staff =
    await prisma.user.upsert({
      where: {
        email:
          STAFF_EMAIL,
      },

      update: {
        name:
          "Development Staff",

        passwordHash:
          staffPasswordHash,

        role:
          UserRole.STAFF,

        active:
          true,
      },

      create: {
        name:
          "Development Staff",

        email:
          STAFF_EMAIL,

        passwordHash:
          staffPasswordHash,

        role:
          UserRole.STAFF,

        active:
          true,
      },
    });

  const supplier =
    await getOrCreateSupplier();

  const coke =
    await getOrCreateProduct({
      sku:
        "COKE-1L",

      name:
        "Coke 1L",

      category:
        "Beverages",

      sellingPrice:
        "75.00",

      reorderLevel:
        5,
    });

  const sardines =
    await getOrCreateProduct({
      sku:
        "SARDINES-155",

      name:
        "Sardines 155g",

      category:
        "Canned Goods",

      sellingPrice:
        "28.50",

      reorderLevel:
        10,
    });

  const noodles =
    await getOrCreateProduct({
      sku:
        "NOODLES-001",

      name:
        "Instant Noodles",

      category:
        "Dry Goods",

      sellingPrice:
        "16.00",

      reorderLevel:
        8,
    });

  /*
   * Avoid creating duplicate initial inventory
   * if the dev seed is run more than once.
   */
  const existingSeedReceipt =
    await prisma.stockReceipt.findFirst({
      where: {
        referenceNo:
          DEV_RECEIPT_REFERENCE,
      },
    });

  if (!existingSeedReceipt) {
    await recordStockReceipt({
      supplierId:
        supplier.id,

      receivedBy:
        owner.id,

      referenceNo:
        DEV_RECEIPT_REFERENCE,

      items: [
        {
          productId:
            coke.id,

          quantity:
            20,

          unitCost:
            "55.00",
        },

        {
          productId:
            sardines.id,

          quantity:
            30,

          unitCost:
            "20.00",
        },

        {
          productId:
            noodles.id,

          quantity:
            15,

          unitCost:
            "11.50",
        },
      ],
    });
  }

  console.log();
  console.log(
    "Development seed completed.",
  );

  console.log();
  console.log(
    "Development login credentials:",
  );

  console.table([
    {
      role:
        "OWNER",

      email:
        owner.email,

      password:
        OWNER_PASSWORD,
    },

    {
      role:
        "STAFF",

      email:
        staff.email,

      password:
        STAFF_PASSWORD,
    },
  ]);

  console.log();

  console.table([
    {
      type:
        "User",

      id:
        owner.id,

      name:
        owner.name,

      note:
        "OWNER active",
    },

    {
      type:
        "User",

      id:
        staff.id,

      name:
        staff.name,

      note:
        "STAFF active",
    },

    {
      type:
        "Supplier",

      id:
        supplier.id,

      name:
        supplier.name,

      note:
        "active",
    },

    {
      type:
        "Product",

      id:
        coke.id,

      name:
        coke.name,

      note:
        "20 initial units",
    },

    {
      type:
        "Product",

      id:
        sardines.id,

      name:
        sardines.name,

      note:
        "30 initial units",
    },

    {
      type:
        "Product",

      id:
        noodles.id,

      name:
        noodles.name,

      note:
        "15 initial units",
    },
  ]);
}

seedDevelopmentDatabase()
  .catch(
    (error: unknown) => {
      console.error(
        "Development database seed failed:",
        error,
      );

      process.exitCode = 1;
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );