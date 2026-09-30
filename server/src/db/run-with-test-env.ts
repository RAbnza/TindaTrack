import { config } from "dotenv";

config({
  path: ".env.test",
  override: true,
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required from .env.test.",
  );
}

const databaseName = new URL(
  databaseUrl,
).pathname.replace(/^\//, "");

if (!databaseName.endsWith("_test")) {
  throw new Error(
    `Refusing to run against non-test database "${databaseName}".`,
  );
}

const script = process.argv[2];

if (!script) {
  throw new Error(
    "A verification script path is required.",
  );
}

await import(script);