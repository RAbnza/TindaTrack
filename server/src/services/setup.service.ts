import bcrypt from "bcryptjs";

import {
  Prisma,
} from "../../generated/prisma/client.js";

import {
  prisma,
} from "../db/prisma.js";

import {
  createInitialOwner as createInitialOwnerRecord,
  hasAnyUsers,
  hasAnyUsersWithClient,
} from "../repositories/setup.repository.js";

const PASSWORD_HASH_ROUNDS = 10;

const MAX_SETUP_ATTEMPTS = 3;

export type CreateInitialOwnerInput = {
  name: string;
  email: string;
  password: string;
};

export class SetupAlreadyCompletedError extends Error {
  constructor() {
    super(
      "Initial setup has already been completed.",
    );

    this.name =
      "SetupAlreadyCompletedError";
  }
}

function isRetryableTransactionError(
  error: unknown,
): boolean {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

export async function getSetupStatus() {
  const userExists =
    await hasAnyUsers();

  return {
    setupRequired:
      !userExists,
  };
}

async function executeSetupTransaction(
  input: {
    name: string;
    email: string;
    passwordHash: string;
  },
) {
  return prisma.$transaction(
    async (tx) => {
      /*
       * The authorization rule for this
       * public bootstrap endpoint:
       *
       * setup is allowed only while the
       * User table is empty.
       */
      const userExists =
        await hasAnyUsersWithClient(
          tx,
        );

      if (userExists) {
        throw new SetupAlreadyCompletedError();
      }

      return createInitialOwnerRecord(
        tx,
        {
          name: input.name,
          email: input.email,
          passwordHash:
            input.passwordHash,
        },
      );
    },
    {
      /*
       * Critical:
       *
       * the empty-table check and OWNER
       * creation participate in one
       * serializable transaction.
       */
      isolationLevel:
        Prisma
          .TransactionIsolationLevel
          .Serializable,
    },
  );
}

export async function createInitialOwner(
  input: CreateInitialOwnerInput,
) {
  const name =
    input.name.trim();

  const email =
    input.email
      .trim()
      .toLowerCase();

  /*
   * Hash before opening the transaction
   * so the transaction stays short.
   */
  const passwordHash =
    await bcrypt.hash(
      input.password,
      PASSWORD_HASH_ROUNDS,
    );

  for (
    let attempt = 1;
    attempt <=
    MAX_SETUP_ATTEMPTS;
    attempt += 1
  ) {
    try {
      return await executeSetupTransaction(
        {
          name,
          email,
          passwordHash,
        },
      );
    } catch (error) {
      const shouldRetry =
        isRetryableTransactionError(
          error,
        );

      const attemptsRemain =
        attempt <
        MAX_SETUP_ATTEMPTS;

      if (
        shouldRetry &&
        attemptsRemain
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    "Initial setup transaction retry loop exited unexpectedly.",
  );
}