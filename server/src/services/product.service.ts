import {
  Prisma,
} from "../../generated/prisma/client.js";

import {
  createProductRecord,
  findProductById,
  getCurrentStock,
  listProductsWithStock,
  updateProductRecord,
  type UpdateProductRecordInput,
} from "../repositories/product.repository.js";

import type {
  CreateProductBody,
  UpdateProductBody,
} from "../validation/product.validation.js";

export type ProductReadModel = {
  id: number;
  sku: string;
  name: string;
  category: string | null;
  sellingPrice: string;
  reorderLevel: number;
  active: boolean;
  currentStock: number;
  lowStock: boolean;
};

export type ProductMasterData = {
  id: number;
  sku: string;
  name: string;
  category: string | null;
  sellingPrice: string;
  reorderLevel: number;
  active: boolean;
};

export class ProductNotFoundError extends Error {
  constructor(
    productId: number,
  ) {
    super(
      `Product ${productId} does not exist.`,
    );

    this.name =
      "ProductNotFoundError";
  }
}

export class ProductSkuConflictError extends Error {
  constructor(
    sku: string,
  ) {
    super(
      `Product SKU "${sku}" is already in use.`,
    );

    this.name =
      "ProductSkuConflictError";
  }
}

function toProductMasterData(
  product: {
    id: number;
    sku: string;
    name: string;
    category: string | null;
    sellingPrice: Prisma.Decimal;
    reorderLevel: number;
    active: boolean;
  },
): ProductMasterData {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    category:
      product.category,
    sellingPrice:
      product.sellingPrice.toString(),
    reorderLevel:
      product.reorderLevel,
    active:
      product.active,
  };
}

function isUniqueConstraintError(
  error: unknown,
): boolean {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function isRecordNotFoundError(
  error: unknown,
): boolean {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

export async function createProduct(
  input: CreateProductBody,
): Promise<ProductMasterData> {
  try {
    const product =
      await createProductRecord({
        sku: input.sku,
        name: input.name,
        category:
          input.category ?? null,
        sellingPrice:
          input.sellingPrice,
        reorderLevel:
          input.reorderLevel,
      });

    return toProductMasterData(
      product,
    );
  } catch (error) {
    if (
      isUniqueConstraintError(
        error,
      )
    ) {
      throw new ProductSkuConflictError(
        input.sku,
      );
    }

    throw error;
  }
}

export async function updateProduct(
  productId: number,
  input: UpdateProductBody,
): Promise<ProductMasterData> {
  /*
   * Build the repository input explicitly.
   *
   * With exactOptionalPropertyTypes enabled,
   * an omitted field and a field whose value
   * is undefined are intentionally different.
   *
   * This also preserves PATCH semantics:
   *
   * category omitted
   * → leave existing category unchanged
   *
   * category: null
   * → explicitly clear category
   */
  const updateInput:
    UpdateProductRecordInput = {
      ...(input.sku !==
      undefined
        ? {
            sku: input.sku,
          }
        : {}),

      ...(input.name !==
      undefined
        ? {
            name: input.name,
          }
        : {}),

      ...(input.category !==
      undefined
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

      ...(input.active !==
      undefined
        ? {
            active:
              input.active,
          }
        : {}),
    };

  try {
    const product =
      await updateProductRecord(
        productId,
        updateInput,
      );

    return toProductMasterData(
      product,
    );
  } catch (error) {
    if (
      isUniqueConstraintError(
        error,
      )
    ) {
      throw new ProductSkuConflictError(
        input.sku ??
          "requested SKU",
      );
    }

    if (
      isRecordNotFoundError(
        error,
      )
    ) {
      throw new ProductNotFoundError(
        productId,
      );
    }

    throw error;
  }
}

export async function listProducts(): Promise<
  ProductReadModel[]
> {
  const products =
    await listProductsWithStock();

  return products.map(
    (product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      category:
        product.category,
      sellingPrice:
        product.sellingPrice.toString(),
      reorderLevel:
        product.reorderLevel,
      active:
        product.active,
      currentStock:
        product.currentStock,
      lowStock:
        product.lowStock,
    }),
  );
}

export async function getProductById(
  productId: number,
): Promise<ProductReadModel> {
  const product =
    await findProductById(
      productId,
    );

  if (!product) {
    throw new ProductNotFoundError(
      productId,
    );
  }

  const currentStock =
    await getCurrentStock(
      product.id,
    );

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    category:
      product.category,
    sellingPrice:
      product.sellingPrice.toString(),
    reorderLevel:
      product.reorderLevel,
    active:
      product.active,
    currentStock,
    lowStock:
      currentStock <=
      product.reorderLevel,
  };
}