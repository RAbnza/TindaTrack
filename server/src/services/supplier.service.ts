import {
  listActiveSuppliers,
} from "../repositories/supplier.repository.js";

export type SupplierReadModel = {
  id: number;
  name: string;
};

export async function listSuppliers(): Promise<
  SupplierReadModel[]
> {
  return listActiveSuppliers();
}