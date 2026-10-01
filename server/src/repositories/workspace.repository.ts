import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";
import { getManilaDayRange } from "../utils/manila-business-day.js";
import {
  pageMeta,
  type CatalogQuery,
  type HistoryQuery,
  type PageQuery,
} from "../validation/pagination.validation.js";

function dateWhere(query: HistoryQuery) {
  return {
    ...(query.from ? { gte: getManilaDayRange(query.from).start } : {}),
    ...(query.to ? { lt: getManilaDayRange(query.to).end } : {}),
  };
}

export async function readProductSelection(ids: number[]) {
  return prisma.$transaction(
    async (db) => {
      const products = await db.product.findMany({ where: { id: { in: ids } } });
      const groups = await db.stockMovement.groupBy({
        by: ["productId"],
        where: { productId: { in: ids } },
        _sum: { quantityDelta: true },
      });
      const stock = new Map(groups.map((g) => [g.productId, g._sum.quantityDelta ?? 0]));
      return products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        sellingPrice: p.sellingPrice.toString(),
        reorderLevel: p.reorderLevel,
        active: p.active,
        currentStock: stock.get(p.id) ?? 0,
        lowStock: (stock.get(p.id) ?? 0) <= p.reorderLevel,
      }));
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}

export async function browseProducts(query: CatalogQuery) {
  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(query.category
      ? { category: { contains: query.category, mode: "insensitive" } }
      : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { sku: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  return prisma.$transaction(
    async (db) => {
      const total = await db.product.count({ where });
      const pagination = pageMeta(total, query);
      const products = await db.product.findMany({
        where,
        orderBy: [{ [query.sort]: "asc" }, { id: "asc" }],
        skip: (pagination.page - 1) * query.pageSize,
        take: query.pageSize,
      });
      const groups = products.length
        ? await db.stockMovement.groupBy({
            by: ["productId"],
            where: { productId: { in: products.map((p) => p.id) } },
            _sum: { quantityDelta: true },
          })
        : [];
      const stock = new Map(groups.map((g) => [g.productId, g._sum.quantityDelta ?? 0]));
      return {
        items: products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          active: p.active,
          reorderLevel: p.reorderLevel,
          sellingPrice: p.sellingPrice.toString(),
          currentStock: stock.get(p.id) ?? 0,
          lowStock: (stock.get(p.id) ?? 0) <= p.reorderLevel,
        })),
        pagination,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}

export async function browseAudit(query: HistoryQuery) {
  const action = {
    SALES: "SALE_CREATED",
    RECEIPTS: "STOCK_RECEIPT_CREATED",
    ADJUSTMENTS: "STOCK_ADJUSTMENT_CREATED",
  }[query.filter as "SALES" | "RECEIPTS" | "ADJUSTMENTS"];
  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action } : {}),
    createdAt: dateWhere(query),
    ...(query.search
      ? {
          OR: [
            { actor: { name: { contains: query.search, mode: "insensitive" } } },
            { action: { contains: query.search, mode: "insensitive" } },
            { entityType: { contains: query.search, mode: "insensitive" } },
            ...(/^\d+$/.test(query.search) && Number(query.search) <= 2147483647
              ? [{ entityId: Number(query.search) }]
              : []),
          ],
        }
      : {}),
  };
  return prisma.$transaction(
    async (db) => {
      const total = await db.auditLog.count({ where });
      const pagination = pageMeta(total, query);
      const items = await db.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          createdAt: true,
          actor: { select: { id: true, name: true, role: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (pagination.page - 1) * query.pageSize,
        take: query.pageSize,
      });
      return { items, pagination };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}

export async function browseMovements(query: HistoryQuery) {
  const types =
    query.filter === "ADJUSTMENT" ? (["ADJUSTMENT_IN", "ADJUSTMENT_OUT"] as const) : null;
  const where: Prisma.StockMovementWhereInput = {
    createdAt: dateWhere(query),
    ...(types
      ? { type: { in: [...types] } }
      : query.filter === "SALE" || query.filter === "RECEIPT"
        ? { type: query.filter }
        : {}),
    ...(query.search
      ? {
          product: {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { sku: { contains: query.search, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };
  return prisma.$transaction(
    async (db) => {
      const total = await db.stockMovement.count({ where });
      const pagination = pageMeta(total, query);
      const records = await db.stockMovement.findMany({
        where,
        select: {
          id: true,
          type: true,
          quantityDelta: true,
          createdAt: true,
          saleItemId: true,
          stockReceiptItemId: true,
          stockAdjustmentId: true,
          product: { select: { id: true, name: true, sku: true } },
          actor: { select: { id: true, name: true, role: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (pagination.page - 1) * query.pageSize,
        take: query.pageSize,
      });
      const items = records.map(
        ({ saleItemId, stockReceiptItemId, stockAdjustmentId, ...r }) => ({
          ...r,
          source:
            r.type === "SALE"
              ? { type: "SALE", saleItemId }
              : r.type === "RECEIPT"
                ? { type: "RECEIPT", stockReceiptItemId }
                : { type: "ADJUSTMENT", stockAdjustmentId },
        }),
      );
      return { items, pagination };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}

export async function browseDailySales(date: string, query: PageQuery) {
  const { start, end } = getManilaDayRange(date);
  const where = { createdAt: { gte: start, lt: end } };
  return prisma.$transaction(
    async (db) => {
      const summary = await db.sale.aggregate({
        where,
        _count: true,
        _sum: { totalAmount: true },
      });
      const pagination = pageMeta(summary._count, query);
      const sales = await db.sale.findMany({
        where,
        include: {
          recordedByUser: { select: { id: true, name: true } },
          saleItems: {
            orderBy: { id: "asc" },
            include: { product: { select: { id: true, name: true } } },
          },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        skip: (pagination.page - 1) * query.pageSize,
        take: query.pageSize,
      });
      return {
        date,
        saleCount: summary._count,
        totalSalesAmount: (summary._sum.totalAmount ?? new Prisma.Decimal(0)).toString(),
        sales: sales.map((s) => ({
          id: s.id,
          createdAt: s.createdAt.toISOString(),
          paymentMethod: s.paymentMethod,
          recordedBy: s.recordedByUser,
          totalAmount: s.totalAmount.toString(),
          items: s.saleItems.map((i) => ({
            productId: i.productId,
            productName: i.product.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice.toString(),
            lineTotal: i.lineTotal.toString(),
          })),
        })),
        pagination,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}
