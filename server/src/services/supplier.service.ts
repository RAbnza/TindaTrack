import {
  createSupplierRecord,
  isSupplierRecordNotFoundError,
  listActiveSuppliers,
  listAllSuppliers,
  updateSupplierRecord,
  type UpdateSupplierRecordInput,
} from "../repositories/supplier.repository.js";

import type {
  CreateSupplierBody,
  UpdateSupplierBody,
} from "../validation/supplier.validation.js";

export type SupplierReadModel = {
  id: number;
  name: string;
};

export type SupplierManagementReadModel = {
  id: number;
  name: string;
  contactDetails: string | null;
  active: boolean;
};

export class SupplierNotFoundError extends Error {
  constructor(
    supplierId: number,
  ) {
    super(
      `Supplier ${supplierId} does not exist.`,
    );

    this.name =
      "SupplierNotFoundError";
  }
}

export async function listSuppliers(): Promise<
  SupplierReadModel[]
> {
  return listActiveSuppliers();
}

export async function listSuppliersForManagement(): Promise<
  SupplierManagementReadModel[]
> {
  return listAllSuppliers();
}

export async function createSupplier(
  input: CreateSupplierBody,
): Promise<SupplierManagementReadModel> {
  return createSupplierRecord({
    name: input.name,

    contactDetails:
      input.contactDetails ??
      null,
  });
}

export async function updateSupplier(
  supplierId: number,
  input: UpdateSupplierBody,
): Promise<SupplierManagementReadModel> {
  const updateInput:
    UpdateSupplierRecordInput = {
      ...(input.name !==
      undefined
        ? {
            name: input.name,
          }
        : {}),

      ...(input.contactDetails !==
      undefined
        ? {
            contactDetails:
              input.contactDetails,
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
    return await updateSupplierRecord(
      supplierId,
      updateInput,
    );
  } catch (error) {
    if (
      isSupplierRecordNotFoundError(
        error,
      )
    ) {
      throw new SupplierNotFoundError(
        supplierId,
      );
    }

    throw error;
  }
}