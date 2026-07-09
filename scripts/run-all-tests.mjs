#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { restartApi } from "./test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const E2E_SCRIPTS = [
  "scripts/test-bookings-messages.mjs",
  "scripts/test-core-features.mjs",
  "scripts/test-remaining-features.mjs",
  "scripts/test-mobile-booking-flow.mjs"
];

function run(command, args, env = {}) {
  console.log(`\n>>> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, ...env }
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  console.log("StageBook — full test suite");

  run("npm", ["test"]);
  run("npm", ["run", "test:web"]);

  await restartApi();

  for (const script of E2E_SCRIPTS) {
    run("node", [script], { SKIP_API_RESTART: "1" });
  }

  console.log("\n=== All tests passed ===");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});