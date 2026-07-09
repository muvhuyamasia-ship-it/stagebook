#!/usr/bin/env node

import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { restartApi } from "./test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MOBILE = path.join(ROOT, "apps/mobile");
const API = process.env.API_BASE_URL ?? "http://localhost:4000";
const METRO = process.env.METRO_BASE_URL ?? "http://localhost:8081";
const SCREENSHOT_DIR = path.join(ROOT, "scripts/.smoke-screenshots");
const EXPO_GO_BUNDLE_ID = "host.exp.Exponent";
const EXPO_SDK_VERSION = "52.0.0";

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

function resolveSimctl() {
  const candidates = [
    "simctl",
    "/Applications/Xcode.app/Contents/Developer/usr/bin/simctl",
    "/Library/Developer/PrivateFrameworks/CoreSimulator.framework/Versions/A/Resources/bin/simctl"
  ];
  for (const candidate of candidates) {
    try {
      if (candidate === "simctl") {
        execSync("xcrun simctl help", { stdio: "ignore" });
        return "xcrun simctl";
      }
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      // try next
    }
  }
  return null;
}

function runSimctl(simctl, args, { allowFailure = false } = {}) {
  const bin = simctl === "xcrun simctl" ? "xcrun" : simctl;
  const fullArgs = simctl === "xcrun simctl" ? ["simctl", ...args] : args;
  try {
    return execSync(`${bin} ${fullArgs.map((a) => JSON.stringify(a)).join(" ")}`, {
      encoding: "utf8"
    }).trim();
  } catch (error) {
    if (allowFailure) return null;
    throw error;
  }
}

function isExpoGoInstalled(simctl, udid) {
  const apps = runSimctl(simctl, ["listapps", udid], { allowFailure: true });
  return Boolean(apps?.includes(EXPO_GO_BUNDLE_ID));
}

async function getExpoGoIosRelease() {
  const response = await fetch("https://exp.host/--/api/v2/versions");
  if (!response.ok) {
    throw new Error(`Expo versions API returned ${response.status}`);
  }
  const data = await response.json();
  const release = data.sdkVersions?.[EXPO_SDK_VERSION];
  if (!release?.iosClientUrl || !release?.iosClientVersion) {
    throw new Error(`No Expo Go release found for SDK ${EXPO_SDK_VERSION}`);
  }
  return {
    url: release.iosClientUrl,
    version: release.iosClientVersion
  };
}

async function ensureExpoGo(simctl, device) {
  if (isExpoGoInstalled(simctl, device.udid)) {
    ok("Expo Go installed on simulator");
    return;
  }

  console.log("  Installing Expo Go for SDK 52…");
  const { url, version } = await getExpoGoIosRelease();
  const cacheDir = path.join(process.env.HOME, ".expo", "ios-simulator-app-cache");
  const appPath = path.join(cacheDir, `Expo-Go-${version}.app`);

  if (!fs.existsSync(appPath)) {
    fs.mkdirSync(cacheDir, { recursive: true });
    const tmpDir = fs.mkdtempSync(path.join(cacheDir, ".download-"));
    const tarPath = path.join(tmpDir, "Expo-Go.tar.gz");
    const archive = await fetch(url);
    if (!archive.ok) {
      throw new Error(`Failed to download Expo Go (${archive.status})`);
    }
    fs.writeFileSync(tarPath, Buffer.from(await archive.arrayBuffer()));
    execSync(`tar -xzf ${JSON.stringify(tarPath)} -C ${JSON.stringify(tmpDir)}`);
    fs.mkdirSync(appPath);
    for (const entry of fs.readdirSync(tmpDir)) {
      if (entry === "Expo-Go.tar.gz") continue;
      fs.renameSync(path.join(tmpDir, entry), path.join(appPath, entry));
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  runSimctl(simctl, ["install", device.udid, appPath]);
  if (!isExpoGoInstalled(simctl, device.udid)) {
    throw new Error("Expo Go install finished but app is not registered on simulator");
  }
  ok(`Expo Go ${version} installed`);
}

function pickIphoneDevice(simctl) {
  const listing = runSimctl(simctl, ["list", "devices", "available"]);
  const lines = listing.split("\n");
  const devices = [];
  for (const line of lines) {
    const match = line.match(
      /^\s+(.+?) \(([A-F0-9-]+)\) \((Available|Booted|Shutdown)\)/i
    );
    if (match && /iphone/i.test(match[1])) {
      devices.push({ name: match[1], udid: match[2], state: match[3] });
    }
  }
  if (devices.length === 0) return null;
  const booted = devices.find((d) => d.state === "Booted");
  if (booted) return booted;
  const preferred = devices.find((d) => /iPhone 16/i.test(d.name)) ?? devices[0];
  return preferred;
}

async function ensureMetro() {
  const status = await fetch(`${METRO}/status`).catch(() => null);
  if (status?.ok) {
    ok("Metro already running");
    return null;
  }

  console.log("  Starting Metro on :8081…");
  const child = spawn("npx", ["expo", "start", "--port", "8081", "--localhost"], {
    cwd: MOBILE,
    stdio: "ignore",
    detached: true,
    env: { ...process.env, EXPO_NO_TELEMETRY: "1" }
  });
  child.unref();

  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${METRO}/status`);
      if (res.ok) {
        ok("Metro started");
        return child;
      }
    } catch {
      // retry
    }
    await sleep(1000);
  }
  fail("Metro startup", "Timed out waiting for packager");
  return child;
}

async function verifyIosBundle() {
  const url = `${METRO}/node_modules/expo-router/entry.bundle?platform=ios&dev=true&minify=false`;
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    fail("iOS JS bundle", body.slice(0, 240) || String(response.status));
    return false;
  }
  const head = (await response.text()).slice(0, 120);
  if (head.includes("__BUNDLE_START_TIME__") || head.includes("__DEV__")) {
    ok("iOS JS bundle compiles for simulator");
    return true;
  }
  fail("iOS JS bundle", "Unexpected bundle output");
  return false;
}

async function openInSimulator(simctl, device) {
  if (device.state !== "Booted" && device.state !== "booted") {
    console.log(`  Booting ${device.name}…`);
    runSimctl(simctl, ["boot", device.udid]);
    ok(`Simulator booted — ${device.name}`);
  } else {
    ok(`Simulator already booted — ${device.name}`);
  }

  try {
    execSync("open -a Simulator", { stdio: "ignore" });
  } catch {
    // Simulator may already be visible.
  }

  await ensureExpoGo(simctl, device);

  const expoUrl = `${METRO.replace("http://", "exp://")}`;
  console.log(`  Opening Expo Go URL: ${expoUrl}`);
  try {
    runSimctl(simctl, ["openurl", device.udid, expoUrl]);
    ok("Launched StageBook in iOS Simulator via Expo Go");
  } catch (error) {
    const detail = error.stderr?.trim() || error.message;
    fail("Open Expo Go URL", detail);
    return;
  }

  await sleep(12000);

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const screenshotPath = path.join(SCREENSHOT_DIR, `ios-smoke-${Date.now()}.png`);
  runSimctl(simctl, ["io", device.udid, "screenshot", screenshotPath]);
  if (fs.existsSync(screenshotPath)) {
    ok(`Simulator screenshot saved (${path.relative(ROOT, screenshotPath)})`);
  } else {
    fail("Simulator screenshot", "File not created");
  }
}

async function apiSmoke() {
  const clientLogin = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "client@stagebook.test", password: "password123" })
  });
  if (!clientLogin.ok) {
    fail("API login for simulator session", String(clientLogin.status));
    return;
  }
  ok("API ready for simulator (client login)");

  const artists = await fetch(`${API}/api/artists`);
  if (!artists.ok) {
    fail("API artists feed", String(artists.status));
    return;
  }
  const list = await artists.json();
  ok(`API artists feed (${list.length} artist(s))`);
}

async function main() {
  console.log("StageBook iOS Simulator smoke test");
  console.log(`API: ${API}  Metro: ${METRO}`);

  console.log("\n=== Prerequisites ===");
  const simctl = resolveSimctl();
  if (!simctl) {
    fail(
      "Xcode iOS Simulator",
      "Full Xcode is required (xcrun simctl not available). Install Xcode from the App Store, then run: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
    );
  } else {
    ok("Xcode simctl available");
  }

  console.log("\n=== Backend + bundler ===");
  await restartApi(API);
  await ensureMetro();
  await verifyIosBundle();
  await apiSmoke();

  if (simctl) {
    console.log("\n=== iOS Simulator ===");
    const device = pickIphoneDevice(simctl);
    if (!device) {
      fail("iOS Simulator device", "No available iPhone simulators found");
    } else {
      await openInSimulator(simctl, device);
    }
  }

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
  if (!simctl) {
    console.log("\nInstall Xcode to complete the on-simulator portion of this smoke test.");
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});