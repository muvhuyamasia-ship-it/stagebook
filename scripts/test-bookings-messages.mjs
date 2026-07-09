#!/usr/bin/env node

import { uniqueBookingSlot } from "./test-helpers.mjs";

const API = process.env.API_BASE_URL ?? "http://localhost:4000";
const WEB = process.env.WEB_BASE_URL ?? "http://localhost:5174";
const MOBILE_API = process.env.MOBILE_API_BASE_URL ?? "http://localhost:4000";

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

async function request(base, path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
  if (options.body) headers.set("Content-Type", "application/json");

  const response = await fetch(`${base}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function login(base, email, password) {
  const { response, payload } = await request(base, "/api/auth/login", {
    method: "POST",
    body: { email, password }
  });
  if (!response.ok) throw new Error(`Login failed for ${email}: ${payload.message ?? response.status}`);
  return payload;
}

async function runFlow(label, base, slot) {
  const { eventDate, startTime, endTime } = slot;
  console.log(`\n=== ${label} ===`);

  const client = await login(base, "client@stagebook.test", "password123");
  ok(`${label}: client login`);

  const { payload: artists } = await request(base, "/api/artists");
  if (!Array.isArray(artists) || artists.length === 0) {
    fail(`${label}: list artists`, "No artists returned");
    return null;
  }
  ok(`${label}: list artists (${artists[0].stageName})`);

  const { response: createRes, payload: created } = await request(base, "/api/bookings", {
    method: "POST",
    token: client.token,
    body: {
      artistProfileId: artists[0].id,
      eventName: `E2E ${label}`,
      eventType: "Corporate",
      eventDate,
      startTime,
      endTime,
      locationLabel: "Sandton Convention Centre",
      latitude: -26.107,
      longitude: 28.054,
      guestCount: 120,
      quotedPriceZar: 21000
    }
  });

  if (!createRes.ok) {
    fail(`${label}: create booking`, created.message ?? createRes.status);
    return null;
  }
  const bookingId = created.booking.id;
  ok(`${label}: create booking (${bookingId.slice(0, 8)}…)`);

  const { response: msgRes, payload: clientMsg } = await request(base, `/api/bookings/${bookingId}/chat`, {
    method: "POST",
    token: client.token,
    body: { body: "Can we confirm soundcheck at 17:00?" }
  });
  if (!msgRes.ok) {
    fail(`${label}: client send message`, clientMsg.message ?? msgRes.status);
    return null;
  }
  ok(`${label}: client send message`);

  const artist = await login(base, "artist@stagebook.test", "password123");
  ok(`${label}: artist login`);

  const { payload: artistBookings } = await request(base, "/api/bookings/me", { token: artist.token });
  const found = artistBookings.some((b) => b.id === bookingId);
  if (!found) {
    fail(`${label}: artist sees booking`, `Booking ${bookingId} not in artist list`);
    return null;
  }
  ok(`${label}: artist sees booking`);

  const { response: counterRes } = await request(base, `/api/bookings/${bookingId}/decision`, {
    method: "POST",
    token: artist.token,
    body: { status: "agreement", counterPriceZar: 23500 }
  });
  if (!counterRes.ok) {
    fail(`${label}: artist counter decision`, counterRes.status);
    return null;
  }
  ok(`${label}: artist counter decision`);

  const { response: counterChatRes } = await request(base, `/api/bookings/${bookingId}/chat`, {
    method: "POST",
    token: artist.token,
    body: {
      body: "Counter-offer: R23,500 · 18:00–20:00 · Includes percussion",
      systemAction: "counter_offer"
    }
  });
  if (!counterChatRes.ok) {
    fail(`${label}: artist counter chat`, counterChatRes.status);
    return null;
  }
  ok(`${label}: artist counter chat`);

  const { response: acceptRes, payload: accepted } = await request(base, `/api/bookings/${bookingId}/decision`, {
    method: "POST",
    token: client.token,
    body: { status: "agreement" }
  });
  if (!acceptRes.ok || accepted.booking?.status !== "agreement") {
    fail(`${label}: client accept offer`, accepted.message ?? acceptRes.status);
    return null;
  }
  ok(`${label}: client accept offer`);

  const { payload: chat } = await request(base, `/api/bookings/${bookingId}/chat`, { token: client.token });
  if (!Array.isArray(chat) || chat.length < 2) {
    fail(`${label}: chat thread`, `Expected ≥2 messages, got ${chat?.length ?? 0}`);
    return null;
  }
  ok(`${label}: chat thread (${chat.length} messages)`);

  const { payload: clientBookings } = await request(base, "/api/bookings/me", { token: client.token });
  const booking = clientBookings.find((b) => b.id === bookingId);
  if (!booking || booking.quotedPriceZar !== 23500) {
    fail(`${label}: booking price updated`, `Expected 23500, got ${booking?.quotedPriceZar}`);
    return null;
  }
  ok(`${label}: booking price updated to R23,500`);

  return bookingId;
}

async function testWebShell() {
  console.log("\n=== Web UI shell ===");
  const pages = ["/", "/login", "/app/messages", "/app/bookings"];
  for (const path of pages) {
    const res = await fetch(`${WEB}${path}`);
    if (res.ok) ok(`Web page ${path} (${res.status})`);
    else fail(`Web page ${path}`, String(res.status));
  }
}

async function testMobileBundle(slot) {
  console.log("\n=== Mobile (API + Metro) ===");
  const res = await fetch("http://localhost:8081/");
  if (res.ok) ok("Mobile Metro responds (200)");
  else fail("Mobile Metro responds", String(res.status));

  const bookingId = await runFlow("Mobile API", MOBILE_API, slot);
  if (!bookingId) return;

  const artist = await login(MOBILE_API, "artist@stagebook.test", "password123");
  const { payload: threads } = await request(MOBILE_API, `/api/bookings/${bookingId}/chat`, {
    token: artist.token
  });
  const hasCounter = threads.some((m) => m.systemAction === "counter_offer");
  if (hasCounter) ok("Mobile API: artist reads counter-offer in thread");
  else fail("Mobile API: artist reads counter-offer in thread", "No counter_offer message");
}

async function main() {
  console.log("StageBook bookings & messages E2E test");
  console.log(`API: ${API}  Web: ${WEB}  Mobile API: ${MOBILE_API}`);

  await runFlow("Direct API", API, uniqueBookingSlot(10));
  await runFlow("Web proxy", WEB, uniqueBookingSlot(20));
  await testWebShell();
  await testMobileBundle(uniqueBookingSlot(30));

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});