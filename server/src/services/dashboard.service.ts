import {
  Prisma,
  UserRole,
} from "../../generated/prisma/client.js";

import {
  listProductsWithStock,
} from "../repositories/product.repository.js";

import {
  countActiveStaff,
  getOwnerSalesForRange,
  getStaffSalesCountForRange,
} from "../repositories/dashboard.repository.js";

import {
  getManilaDateString,
  getManilaDayRange,
} from "../utils/manila-business-day.js";

type DashboardUser = {
  userId: number;
  role: UserRole;
};

type LowStockPreviewItem = {
  id: number;
  sku: string;
  name: string;
  currentStock: number;
  reorderLevel: number;
};

function toLowStockPreview(
  products: Awaited<
    ReturnType<
      typeof listProductsWithStock
    >
  >,
): LowStockPreviewItem[] {
  return products
    .filter(
      (product) =>
        product.active &&
        product.currentStock <=
          product.reorderLevel,
    )
    .slice(
      0,
      5,
    )
    .map(
      (product) => ({
        id: product.id,
        sku: product.sku,
        name: product.name,

        currentStock:
          product.currentStock,

        reorderLevel:
          product.reorderLevel,
      }),
    );
}

export async function getDashboard(
  auth: DashboardUser,
  now: Date = new Date(),
) {
  const date =
    getManilaDateString(
      now,
    );

  const {
    start,
    end,
  } =
    getManilaDayRange(
      date,
    );

  /*
   * Inventory remains ledger-derived.
   */
  const products =
    await listProductsWithStock();

  const activeProducts =
    products.filter(
      (product) =>
        product.active,
    );

  const lowStockProducts =
    activeProducts.filter(
      (product) =>
        product.currentStock <=
        product.reorderLevel,
    );

  const outOfStockProducts =
    activeProducts.filter(
      (product) =>
        product.currentStock <=
        0,
    );

  const lowStockPreview =
    toLowStockPreview(
      products,
    );

  if (
    auth.role ===
    UserRole.OWNER
  ) {
    const [
      sales,
      activeStaffCount,
    ] =
      await Promise.all([
        getOwnerSalesForRange(
          start,
          end,
        ),

        countActiveStaff(),
      ]);

    return {
      role:
        UserRole.OWNER,

      date,

      metrics: {
        salesCount:
          sales.count,

        totalSalesAmount:
          (
            sales.totalAmount ??
            new Prisma.Decimal(
              0,
            )
          ).toString(),

        lowStockCount:
          lowStockProducts.length,

        outOfStockCount:
          outOfStockProducts.length,

        activeProductCount:
          activeProducts.length,

        activeStaffCount,
      },

      lowStockProducts:
        lowStockPreview,
    } as const;
  }

  const mySalesCount =
    await getStaffSalesCountForRange(
      auth.userId,
      start,
      end,
    );

  return {
    role:
      UserRole.STAFF,

    date,

    metrics: {
      mySalesCount,

      lowStockCount:
        lowStockProducts.length,

      outOfStockCount:
        outOfStockProducts.length,

      activeProductCount:
        activeProducts.length,
    },

    lowStockProducts:
      lowStockPreview,
  } as const;
}