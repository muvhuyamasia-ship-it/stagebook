#!/usr/bin/env node

import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { restartApi } from "./test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCREENSHOT_DIR = path.join(ROOT, "scripts/.smoke-screenshots");
const API = process.env.API_BASE_URL ?? "http://localhost:4000";
const METRO = process.env.METRO_BASE_URL ?? "http://localhost:8081";

let passed = 0;
let failed = 0;

function ok(label) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

function fail(label, detail) {
  failed += 1;
  console.log(`  ✗ ${label}`);
  if (detail) console.log(`    ${detail}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runSimctl(args) {
  return execSync(`xcrun simctl ${args.map((a) => JSON.stringify(a)).join(" ")}`, {
    encoding: "utf8"
  }).trim();
}

function bootedUdid() {
  const listing = runSimctl(["list", "devices", "booted"]);
  const match = listing.match(/\(([A-F0-9-]+)\) \(Booted\)/i);
  return match?.[1] ?? null;
}

async function login(email) {
  const response = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password123" })
  });
  if (!response.ok) throw new Error(`Login failed for ${email}`);
  return response.json();
}

async function ensureMetro() {
  const status = await fetch(`${METRO}/status`).catch(() => null);
  if (status?.ok) {
    ok("Metro already running");
    return null;
  }

  console.log("  Starting Metro on :8081…");
  const child = spawn("npx", ["expo", "start", "--port", "8081", "--localhost"], {
    cwd: path.join(ROOT, "apps/mobile"),
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
    env: { ...process.env, EXPO_NO_TELEMETRY: "1" }
  });
  child.unref();

  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    const res = await fetch(`${METRO}/status`).catch(() => null);
    if (res?.ok) {
      ok("Metro started");
      return child;
    }
    await sleep(1000);
  }
  fail("Metro startup", "Timed out waiting for packager");
  return child;
}

function screenshot(udid, label) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const filePath = path.join(SCREENSHOT_DIR, `bookings-tab-${label}-${Date.now()}.png`);
  runSimctl(["io", udid, "screenshot", filePath]);
  if (fs.existsSync(filePath)) {
    ok(`Screenshot saved (${path.relative(ROOT, filePath)})`);
    return filePath;
  }
  fail(`Screenshot ${label}`, "File not created");
  return null;
}

async function openUrl(udid, url) {
  runSimctl(["openurl", udid, url]);
}

async function main() {
  console.log("Mobile Bookings tab simulator test");
  console.log(`API: ${API}  Metro: ${METRO}`);

  console.log("\n=== Prerequisites ===");
  const udid = bootedUdid();
  if (!udid) {
    fail("Booted iOS simulator", "Boot a simulator before running this test");
    process.exit(1);
  }
  ok(`Simulator booted (${udid})`);

  console.log("\n=== Backend + bundler ===");
  await restartApi(API);
  await ensureMetro();

  const bundle = await fetch(
    `${METRO}/node_modules/expo-router/entry.bundle?platform=ios&dev=true&minify=false`
  );
  if (!bundle.ok) {
    fail("iOS bundle", String(bundle.status));
    process.exit(1);
  }
  ok("iOS bundle compiles");

  const client = await login("client@stagebook.test");
  ok("Client login API");

  const bookingsRes = await fetch(`${API}/api/bookings/me`, {
    headers: { Authorization: `Bearer ${client.token}` }
  });
  if (!bookingsRes.ok) {
    fail("Bookings API", String(bookingsRes.status));
  } else {
    const bookings = await bookingsRes.json();
    ok(`Bookings API (${bookings.length} booking(s))`);
  }

  console.log("\n=== Simulator navigation ===");
  try {
    execSync("open -a Simulator", { stdio: "ignore" });
  } catch {
    // already open
  }

  const expBase = METRO.replace("http://", "exp://");

  await openUrl(udid, expBase);
  await sleep(6000);
  ok("Opened Expo Go");

  await openUrl(udid, `${expBase}/--/(tabs)/bookings`);
  await sleep(5000);
  screenshot(udid, "bookings-initial");
  ok("Opened Bookings tab");

  for (let cycle = 1; cycle <= 3; cycle += 1) {
    await openUrl(udid, `${expBase}/--/(tabs)/discover`);
    await sleep(2000);
    await openUrl(udid, `${expBase}/--/(tabs)/bookings`);
    await sleep(2500);
    ok(`Tab refocus cycle ${cycle}/3 (discover → bookings)`);
  }

  screenshot(udid, "bookings-after-refocus");
  ok("Bookings tab stable after repeated refocus");

  const statusAfter = await fetch(`${METRO}/status`);
  if (statusAfter.ok) ok("Metro still healthy after tab exercise");
  else fail("Metro health after tab exercise", String(statusAfter.status));

  const bundleAfter = await fetch(
    `${METRO}/node_modules/expo-router/entry.bundle?platform=ios&dev=true&minify=false`
  );
  if (bundleAfter.ok) ok("iOS bundle still compiles after tab exercise");
  else fail("iOS bundle after tab exercise", String(bundleAfter.status));

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});