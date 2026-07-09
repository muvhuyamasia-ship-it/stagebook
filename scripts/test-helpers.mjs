import { execSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RUN_EPOCH = Date.now();
let slotCounter = 0;
const TIME_SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_API_BASE = process.env.API_BASE_URL ?? "http://localhost:4000";

export function uniqueBookingSlot(seed = 0) {
  slotCounter += 1;
  const offset = slotCounter + seed;
  const eventDate = new Date(RUN_EPOCH + offset * 86_400_000).toISOString().slice(0, 10);
  const startTime = TIME_SLOTS[offset % TIME_SLOTS.length];
  const [h] = startTime.split(":").map(Number);
  const endTime = `${String(h + 2).padStart(2, "0")}:00`;
  return { eventDate, startTime, endTime };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForApi(baseUrl, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // API still starting
    }
    await sleep(500);
  }
  throw new Error(`API did not become healthy within ${timeoutMs}ms (${baseUrl})`);
}

export async function restartApi(baseUrl = DEFAULT_API_BASE) {
  if (process.env.SKIP_API_RESTART === "1") {
    console.log("\n=== API restart skipped (SKIP_API_RESTART=1) ===");
    await waitForApi(baseUrl);
    return;
  }

  console.log("\n=== Restarting API (clean in-memory state) ===");

  try {
    execSync("lsof -ti :4000 | xargs kill -9 2>/dev/null || true", {
      stdio: "ignore",
      shell: true
    });
  } catch {
    // Port may already be free.
  }

  await sleep(1500);

  const child = spawn("npm", ["run", "dev:api"], {
    cwd: ROOT,
    stdio: "ignore",
    detached: true,
    env: process.env
  });
  child.unref();

  await waitForApi(baseUrl);
  console.log(`  ✓ API ready at ${baseUrl}`);
}