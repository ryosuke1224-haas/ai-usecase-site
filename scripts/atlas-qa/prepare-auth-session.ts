import { inspectStorageState } from "../../e2e/support/auth-state";
import { prepareAuthenticatedSession } from "./auth-session";

async function main() {
  const before = inspectStorageState();
  console.log(`Stored Playwright session: ${before.status}`);
  const result = await prepareAuthenticatedSession();
  if (result.status !== "ready") {
    console.error(result.reason);
    process.exit(2);
  }
  const after = inspectStorageState(result.path);
  console.log(
    result.refreshed
      ? "Refreshed the existing Playwright session with the stored refresh token."
      : "Reused the stored Playwright session.",
  );
  console.log(`Session status: ${after.status}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
