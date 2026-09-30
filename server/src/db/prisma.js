import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL is required but was not found in the environment.");
}
const adapter = new PrismaPg({
    connectionString: databaseUrl,
});
export const prisma = new PrismaClient({
    adapter,
});
//# sourceMappingURL=prisma.js.map