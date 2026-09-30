import {
  findProductById,
  getCurrentStock,
  listProductsWithStock,
} from "../repositories/product.repository.js";

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

export class ProductNotFoundError extends Error {
  constructor(productId: number) {
    super(`Product ${productId} does not exist.`);
    this.name = "ProductNotFoundError";
  }
}

export async function listProducts(): Promise<
  ProductReadModel[]
> {
  const products = await listProductsWithStock();

  return products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    sellingPrice: product.sellingPrice.toString(),
    reorderLevel: product.reorderLevel,
    active: product.active,
    currentStock: product.currentStock,
    lowStock: product.lowStock,
  }));
}

export async function getProductById(
  productId: number,
): Promise<ProductReadModel> {
  const product = await findProductById(productId);

  if (!product) {
    throw new ProductNotFoundError(productId);
  }

  const currentStock = await getCurrentStock(product.id);

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    sellingPrice: product.sellingPrice.toString(),
    reorderLevel: product.reorderLevel,
    active: product.active,
    currentStock,
    lowStock: currentStock <= product.reorderLevel,
  };
}