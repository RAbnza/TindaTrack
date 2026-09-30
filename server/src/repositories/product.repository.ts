import { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../db/prisma.js";

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

export async function findProductById(productId: number) {
  return prisma.product.findUnique({
    where: {
      id: productId,
    },
  });
}

export async function getCurrentStockWithClient(
  db: StockQueryClient,
  productId: number,
): Promise<number> {
  const result = await db.stockMovement.aggregate({
    where: {
      productId,
    },
    _sum: {
      quantityDelta: true,
    },
  });

  return result._sum.quantityDelta ?? 0;
}

export async function getCurrentStock(
  productId: number,
): Promise<number> {
  return getCurrentStockWithClient(prisma, productId);
}

export async function listProductsWithStock(): Promise<
  ProductInventoryItem[]
> {
  const products = await prisma.product.findMany({
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

  const stockGroups = await prisma.stockMovement.groupBy({
    by: ["productId"],
    _sum: {
      quantityDelta: true,
    },
  });

  const stockByProductId = new Map<number, number>();

  for (const group of stockGroups) {
    stockByProductId.set(
      group.productId,
      group._sum.quantityDelta ?? 0,
    );
  }

  return products.map((product) => {
    const currentStock =
      stockByProductId.get(product.id) ?? 0;

    return {
      ...product,
      currentStock,
      lowStock: currentStock <= product.reorderLevel,
    };
  });
}

export async function listLowStockProducts(): Promise<
  ProductInventoryItem[]
> {
  const products = await listProductsWithStock();

  return products.filter((product) => product.lowStock);
}