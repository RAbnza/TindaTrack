import {
  Prisma,
  UserRole,
} from "../../generated/prisma/client.js";

import {
  prisma,
} from "../db/prisma.js";

export async function hasAnyUsers(): Promise<boolean> {
  const user =
    await prisma.user.findFirst({
      select: {
        id: true,
      },
    });

  return user !== null;
}

export async function hasAnyUsersWithClient(
  db: Prisma.TransactionClient,
): Promise<boolean> {
  const user =
    await db.user.findFirst({
      select: {
        id: true,
      },
    });

  return user !== null;
}

type CreateInitialOwnerInput = {
  name: string;
  email: string;
  passwordHash: string;
};

export function createInitialOwner(
  db: Prisma.TransactionClient,
  input: CreateInitialOwnerInput,
) {
  return db.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash:
        input.passwordHash,

      /*
       * Bootstrap authorization is
       * decided exclusively by the server.
       */
      role: UserRole.OWNER,
      active: true,
    },

    /*
     * Never allow passwordHash to leave
     * the repository through this flow.
     */
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
    },
  });
}