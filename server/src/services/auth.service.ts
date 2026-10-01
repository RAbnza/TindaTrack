import bcrypt from "bcryptjs";
import {
  SignJWT,
} from "jose";

import { prisma } from "../db/prisma.js";

const JWT_ISSUER = "tindatrack-api";
const JWT_AUDIENCE = "tindatrack-client";

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password.");
    this.name = "InvalidCredentialsError";
  }
}

export class InactiveUserError extends Error {
  constructor() {
    super("User account is inactive.");
    this.name = "InactiveUserError";
  }
}

function getJwtSecret(): Uint8Array {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "JWT_SECRET is required but was not found in the environment.",
    );
  }

  if (jwtSecret.length < 32) {
    throw new Error(
      "JWT_SECRET must be at least 32 characters long.",
    );
  }

  return new TextEncoder().encode(jwtSecret);
}

export async function login(
  email: string,
  password: string,
) {
  const normalizedEmail = email
    .trim()
    .toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!user) {
    throw new InvalidCredentialsError();
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new InvalidCredentialsError();
  }

  if (!user.active) {
    throw new InactiveUserError();
  }

  const token = await new SignJWT({
    role: user.role,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(String(user.id))
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getJwtSecret());

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export const authTokenConfig = {
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
  getSecret: getJwtSecret,
};