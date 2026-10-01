import {
  Prisma,
} from "../../generated/prisma/client.js";

import {
  prisma,
} from "../db/prisma.js";

type StockQueryClient = Pick<
  Prisma.TransactionClient,
  "product" | "stockMovement"
>;

export type ProductInventoryItem = {
  id: number;
  sku: string;
  name: string;
  category: string | null;
  sellingPrice: Prisma.Decimal;
  reorderLevel: number;
  active: boolean;
  currentStock: number;
  lowStock: boolean;
};

export type CreateProductRecordInput = {
  sku: string;
  name: string;
  category?: string | null;
  sellingPrice: string;
  reorderLevel: number;
};

export type UpdateProductRecordInput = {
  sku?: string;
  name?: string;
  category?: string | null;
  sellingPrice?: string;
  reorderLevel?: number;
  active?: boolean;
};

export async function findProductById(
  productId: number,
) {
  return prisma.product.findUnique({
    where: {
      id: productId,
    },
  });
}

export function createProductRecord(
  input: CreateProductRecordInput,
) {
  return prisma.product.create({
    data: {
      sku: input.sku,
      name: input.name,
      category:
        input.category ?? null,
      sellingPrice:
        input.sellingPrice,
      reorderLevel:
        input.reorderLevel,

      /*
       * Product creation does not create
       * inventory. It only creates the
       * master-data record.
       */
      active: true,
    },
  });
}

export function updateProductRecord(
  productId: number,
  input: UpdateProductRecordInput,
) {
  return prisma.product.update({
    where: {
      id: productId,
    },

    /*
     * Undefined means "not supplied".
     * Null category means "clear category".
     */
    data: {
      ...(input.sku !== undefined
        ? {
            sku: input.sku,
          }
        : {}),

      ...(input.name !== undefined
        ? {
            name: input.name,
          }
        : {}),

      ...(input.category !== undefined
        ? {
            category:
              input.category,
          }
        : {}),

      ...(input.sellingPrice !==
      undefined
        ? {
            sellingPrice:
              input.sellingPrice,
          }
        : {}),

      ...(input.reorderLevel !==
      undefined
        ? {
            reorderLevel:
              input.reorderLevel,
          }
        : {}),

      ...(input.active !== undefined
        ? {
            active:
              input.active,
          }
        : {}),
    },
  });
}

export async function getCurrentStockWithClient(
  db: StockQueryClient,
  productId: number,
): Promise<number> {
  const result =
    await db.stockMovement.aggregate({
      where: {
        productId,
      },

      _sum: {
        quantityDelta: true,
      },
    });

  return (
    result._sum.quantityDelta ??
    0
  );
}

export async function getCurrentStock(
  productId: number,
): Promise<number> {
  return getCurrentStockWithClient(
    prisma,
    productId,
  );
}

export async function listProductsWithStock(): Promise<
  ProductInventoryItem[]
> {
  const products =
    await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        sellingPrice: true,
        reorderLevel: true,
        active: true,
      },

      orderBy: {
        name: "asc",
      },
    });

  const stockGroups =
    await prisma.stockMovement.groupBy({
      by: ["productId"],

      _sum: {
        quantityDelta: true,
      },
    });

  const stockByProductId =
    new Map<number, number>();

  for (const group of stockGroups) {
    stockByProductId.set(
      group.productId,
      group._sum.quantityDelta ??
        0,
    );
  }

  return products.map(
    (product) => {
      const currentStock =
        stockByProductId.get(
          product.id,
        ) ?? 0;

      return {
        ...product,
        currentStock,
        lowStock:
          currentStock <=
          product.reorderLevel,
      };
    },
  );
}

export async function listLowStockProducts(): Promise<
  ProductInventoryItem[]
> {
  const products =
    await listProductsWithStock();

  return products.filter(
    (product) =>
      product.lowStock,
  );
}