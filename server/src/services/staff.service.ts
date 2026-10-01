import bcrypt from "bcryptjs";

import {
  Prisma,
} from "../../generated/prisma/client.js";

import {
  createStaffRecord,
  findStaffById,
  listStaffRecords,
  updateStaffRecord,
  type UpdateStaffRecordInput,
} from "../repositories/staff.repository.js";

import type {
  CreateStaffBody,
  UpdateStaffBody,
} from "../validation/staff.validation.js";

const PASSWORD_HASH_ROUNDS = 10;

export type StaffReadModel = {
  id: number;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
};

export class StaffNotFoundError extends Error {
  constructor(
    staffId: number,
  ) {
    super(
      `Staff account ${staffId} does not exist.`,
    );

    this.name =
      "StaffNotFoundError";
  }
}

export class StaffEmailConflictError extends Error {
  constructor(
    email: string,
  ) {
    super(
      `Email "${email}" is already in use.`,
    );

    this.name =
      "StaffEmailConflictError";
  }
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

function toStaffReadModel(
  staff: {
    id: number;
    name: string;
    email: string;
    active: boolean;
    createdAt: Date;
  },
): StaffReadModel {
  return {
    id: staff.id,
    name: staff.name,
    email: staff.email,
    active: staff.active,

    createdAt:
      staff.createdAt.toISOString(),
  };
}

export async function listStaff(): Promise<
  StaffReadModel[]
> {
  const staff =
    await listStaffRecords();

  return staff.map(
    toStaffReadModel,
  );
}

export async function createStaff(
  input: CreateStaffBody,
): Promise<StaffReadModel> {
  const passwordHash =
    await bcrypt.hash(
      input.password,
      PASSWORD_HASH_ROUNDS,
    );

  try {
    const staff =
      await createStaffRecord({
        name: input.name,

        email:
          input.email
            .trim()
            .toLowerCase(),

        passwordHash,
      });

    return toStaffReadModel(
      staff,
    );
  } catch (error) {
    if (
      isUniqueConstraintError(
        error,
      )
    ) {
      throw new StaffEmailConflictError(
        input.email,
      );
    }

    throw error;
  }
}

export async function updateStaff(
  staffId: number,
  input: UpdateStaffBody,
): Promise<StaffReadModel> {
  /*
   * Staff endpoints must never operate
   * on OWNER accounts.
   */
  const existingStaff =
    await findStaffById(
      staffId,
    );

  if (!existingStaff) {
    throw new StaffNotFoundError(
      staffId,
    );
  }

  /*
   * Preserve proper PATCH semantics and
   * exactOptionalPropertyTypes behavior.
   */
  const updateInput:
    UpdateStaffRecordInput = {
      ...(input.name !== undefined
        ? {
            name: input.name,
          }
        : {}),

      ...(input.email !== undefined
        ? {
            email:
              input.email
                .trim()
                .toLowerCase(),
          }
        : {}),

      ...(input.active !== undefined
        ? {
            active: input.active,
          }
        : {}),
    };

  try {
    const staff =
      await updateStaffRecord(
        staffId,
        updateInput,
      );

    return toStaffReadModel(
      staff,
    );
  } catch (error) {
    if (
      isUniqueConstraintError(
        error,
      )
    ) {
      throw new StaffEmailConflictError(
        input.email ??
          "requested email",
      );
    }

    throw error;
  }
}