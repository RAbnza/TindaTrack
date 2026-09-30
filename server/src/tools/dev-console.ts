import { spawnSync } from "node:child_process";
import {
  createInterface,
} from "node:readline/promises";
import {
  stdin as input,
  stdout as output,
} from "node:process";

const rl = createInterface({
  input,
  output,
});

type MenuAction = {
  key: string;
  title: string;
  description: string;
  run: () => Promise<void> | void;
  pauseAfter?: boolean;
};

function clearScreen(): void {
  console.clear();
}

function heading(title: string): void {
  console.log("=".repeat(60));
  console.log(`  ${title}`);
  console.log("=".repeat(60));
  console.log();
}

function runNpmScript(script: string): boolean {
  console.log();
  console.log(`Running: npm run ${script}`);
  console.log();

  const result = spawnSync(
    "npm",
    ["run", script],
    {
      stdio: "inherit",

      // npm is exposed through npm.cmd on Windows.
      // Let the Windows shell resolve it correctly.
      shell: process.platform === "win32",
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    console.log();
    console.log(
      `Command failed with exit code ${result.status}.`,
    );

    return false;
  }

  return true;
}

async function pause(): Promise<void> {
  console.log();

  await rl.question(
    "Press Enter to return to the menu...",
  );
}

async function showMenu(
  title: string,
  actions: MenuAction[],
): Promise<void> {
  while (true) {
    clearScreen();
    heading(title);

    for (const action of actions) {
      console.log(
        `${action.key}. ${action.title}`,
      );

      console.log(
        `   ${action.description}`,
      );

      console.log();
    }

    console.log("0. Back");
    console.log();

    const answer = (
      await rl.question("Choose an option: ")
    ).trim();

    if (answer === "0") {
      return;
    }

    const selected = actions.find(
      (action) => action.key === answer,
    );

    if (!selected) {
      console.log();
      console.log("Invalid option.");

      await pause();
      continue;
    }

    clearScreen();
    heading(selected.title);

    console.log(selected.description);
    console.log();

    try {
      await selected.run();
    } catch (error) {
      console.error();
      console.error("Command failed:");

      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(error);
      }
    }

    if (selected.pauseAfter !== false) {
      await pause();
    }
  }
}

async function databaseMenu(): Promise<void> {
  await showMenu(
    "Test Database Tools",
    [
      {
        key: "1",
        title: "Reset test database",
        description:
          "Deletes all application data from tindatrack_test. The database schema remains.",
        run: () => {
          runNpmScript("db:test:reset");
        },
      },
      {
        key: "2",
        title: "Seed test database",
        description:
          "Adds the standard sample users, suppliers, products, and starting inventory to tindatrack_test.",
        run: () => {
          runNpmScript("db:test:seed");
        },
      },
      {
        key: "3",
        title: "Reseed test database",
        description:
          "Resets tindatrack_test and then loads the standard sample dataset. Use this for a clean known starting state.",
        run: () => {
          runNpmScript("db:test:reseed");
        },
      },
    ],
  );
}

async function chooseVerificationDatabase(
  name: string,
  devScript: string,
  testScript: string,
): Promise<void> {
  await showMenu(
    `${name} — Choose Database`,
    [
      {
        key: "1",
        title: "Test database",
        description:
          "Recommended. Uses .env.test and may safely create verification data in tindatrack_test.",
        run: () => {
          runNpmScript(testScript);
        },
      },
      {
        key: "2",
        title: "Development database",
        description:
          "Uses your normal .env database. WARNING: the verification may create permanent development records.",
        run: () => {
          runNpmScript(devScript);
        },
      },
    ],
  );
}

async function verificationMenu(): Promise<void> {
  await showMenu(
    "Verification Checks",
    [
      {
        key: "1",
        title: "Stock receipt verification",
        description:
          "Checks successful receiving, inventory increase, stock movements, and receipt rollback behavior.",
        run: async () => {
          await chooseVerificationDatabase(
            "Stock Receipt Verification",
            "service:stock-receipt-check",
            "service:stock-receipt-check:test",
          );
        },
        pauseAfter: false,
      },
      {
        key: "2",
        title: "Stock adjustment verification",
        description:
          "Checks positive/negative adjustments and prevents inventory from going below zero.",
        run: async () => {
          await chooseVerificationDatabase(
            "Stock Adjustment Verification",
            "service:stock-adjustment-check",
            "service:stock-adjustment-check:test",
          );
        },
        pauseAfter: false,
      },
      {
        key: "3",
        title: "Sale verification",
        description:
          "Checks authoritative pricing, totals, SALE movements, inventory reduction, and transaction rollback.",
        run: async () => {
          await chooseVerificationDatabase(
            "Sale Verification",
            "service:sale-check",
            "service:sale-check:test",
          );
        },
        pauseAfter: false,
      },
      {
        key: "4",
        title: "Inventory read-model verification",
        description:
          "Checks that current stock and low-stock status are derived from StockMovement records.",
        run: () => {
          runNpmScript("repo:inventory-check");
        },
      },
      {
        key: "5",
        title: "Database connection check",
        description:
          "Performs a simple development database connection/query check.",
        run: () => {
          runNpmScript("db:check");
        },
      },
    ],
  );
}

async function mainMenu(): Promise<void> {
  while (true) {
    clearScreen();
    heading("TindaTrack Developer Console");

    console.log(
      "Use this console for common development, database, and verification tasks.",
    );

    console.log();

    console.log("1. Test database tools");
    console.log(
      "   Reset, seed, or reseed the dedicated test database.",
    );

    console.log();

    console.log("2. Verification checks");
    console.log(
      "   Run receipt, adjustment, sale, inventory, and DB checks.",
    );

    console.log();

    console.log("3. Run integration tests");
    console.log(
      "   Runs the Vitest suite against the test database.",
    );

    console.log();

    console.log("4. Build backend");
    console.log(
      "   Type-checks and compiles the backend with TypeScript.",
    );

    console.log();

    console.log("5. Test then build");
    console.log(
      "   Runs the full automated test suite, then builds only if tests pass.",
    );

    console.log();

    console.log("0. Exit");
    console.log();

    const answer = (
      await rl.question("Choose an option: ")
    ).trim();

    switch (answer) {
      case "1":
        await databaseMenu();
        break;

      case "2":
        await verificationMenu();
        break;

      case "3":
        clearScreen();
        heading("Integration Tests");

        runNpmScript("test");

        await pause();
        break;

      case "4":
        clearScreen();
        heading("Backend Build");

        runNpmScript("build");

        await pause();
        break;

      case "5": {
        clearScreen();
        heading("Test + Build");

        const testsPassed =
          runNpmScript("test");

        if (!testsPassed) {
          console.log();
          console.log(
            "Build skipped because the test suite failed.",
          );

          await pause();
          break;
        }

        console.log();
        console.log(
          "Tests passed. Starting build...",
        );

        runNpmScript("build");

        await pause();
        break;
      }

      case "0":
        return;

      default:
        console.log();
        console.log("Invalid option.");

        await pause();
    }
  }
}

async function main(): Promise<void> {
  try {
    await mainMenu();
  } finally {
    rl.close();
  }
}

await main();