import { config } from "dotenv";

config({
  path: ".env.test",
  override: true,
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Integration tests require DATABASE_URL from .env.test.",
  );
}

const parsedDatabaseUrl = new URL(databaseUrl);

const databaseName = parsedDatabaseUrl.pathname.replace(
  /^\//,
  "",
);

if (!databaseName.endsWith("_test")) {
  throw new Error(
    `Refusing to run integration tests against non-test database "${databaseName}".`,
  );
}