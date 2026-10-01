import type { UserRole } from "../../generated/prisma/client.js";

export type AuthUser = {
  id: number;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export {};