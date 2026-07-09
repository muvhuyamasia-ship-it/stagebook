#!/usr/bin/env node

import { uniqueBookingSlot } from "./test-helpers.mjs";

const API = process.env.MOBILE_API_BASE_URL ?? process.env.API_BASE_URL ?? "http://localhost:4000";
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

async function request(path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
  if (options.body) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function login(email) {
  const { response, payload } = await request("/api/auth/login", {
    method: "POST",
    body: { email, password: "password123" }
  });
  if (!response.ok) throw new Error(payload.message ?? `Login failed (${response.status})`);
  return payload;
}

async function smokeMetro() {
  console.log("\n=== Mobile shell (Metro) ===");

  const landing = await fetch(`${METRO}/`);
  if (landing.ok) ok(`Metro landing (${landing.status})`);
  else fail("Metro landing", String(landing.status));

  const status = await fetch(`${METRO}/status`);
  const statusText = status.ok ? await status.text() : "";
  if (status.ok && statusText.includes("running")) ok("Metro packager running");
  else fail("Metro packager status", statusText || String(status.status));

  const bundle = await fetch(
    `${METRO}/node_modules/expo-router/entry.bundle?platform=ios&dev=true`
  );
  if (bundle.ok) {
    const head = (await bundle.text()).slice(0, 80);
    if (head.includes("__BUNDLE_START_TIME__") || head.includes("__DEV__")) {
      ok("Metro iOS bundle compiles");
    } else {
      fail("Metro iOS bundle", "Unexpected bundle output");
    }
  } else {
    const err = await bundle.text();
    fail("Metro iOS bundle", err.slice(0, 200) || String(bundle.status));
  }
}

async function smokeBookingFlow() {
  console.log("\n=== Mobile booking flow (API) ===");
  const slot = uniqueBookingSlot(200 + Math.floor(Date.now() % 50_000));
  const eventName = `Mobile smoke ${Date.now()}`;

  const client = await login("client@stagebook.test");
  ok("Client login → discover session");

  const { response: artistsRes, payload: artists } = await request("/api/artists");
  if (!artistsRes.ok || !Array.isArray(artists) || artists.length === 0) {
    fail("Discover — list artists", artists?.message ?? artistsRes.status);
    return;
  }
  const artist = artists[0];
  ok(`Discover — ${artists.length} artist(s), tap opens profile (${artist.stageName})`);

  const { response: artistRes, payload: profile } = await request(`/api/artists/${artist.id}`);
  if (!artistRes.ok || profile.id !== artist.id) {
    fail("Artist profile — GET /artists/:id", profile.message ?? artistRes.status);
    return;
  }
  ok(`Artist profile — bio, genres, pricing (from ${profile.basePriceZar} ZAR)`);

  const { response: createRes, payload: created } = await request("/api/bookings", {
    method: "POST",
    token: client.token,
    body: {
      artistProfileId: artist.id,
      eventName,
      eventType: "Corporate",
      eventDate: slot.eventDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      locationLabel: "Sandton Convention Centre",
      latitude: -26.107,
      longitude: 28.054,
      guestCount: 150,
      quotedPriceZar: profile.basePriceZar
    }
  });
  if (!createRes.ok || !created.booking?.id) {
    fail("Booking wizard — submit request", created.message ?? createRes.status);
    return;
  }
  const bookingId = created.booking.id;
  ok(`Booking wizard — request sent (${slot.eventDate} ${slot.startTime})`);

  await request(`/api/bookings/${bookingId}/chat`, {
    method: "POST",
    token: client.token,
    body: {
      body: `Booking request sent for ${eventName} on ${slot.eventDate}.`,
      systemAction: "notification"
    }
  });
  ok("Booking wizard — intro chat tile posted");

  const { payload: clientBookings } = await request("/api/bookings/me", { token: client.token });
  const mine = clientBookings.find((b) => b.id === bookingId);
  if (!mine || mine.status !== "request_sent") {
    fail("Bookings tab — client sees new booking", mine?.status ?? "not found");
    return;
  }
  ok("Bookings tab — client schedule shows request_sent");

  const { payload: chat } = await request(`/api/bookings/${bookingId}/chat`, { token: client.token });
  if (!Array.isArray(chat) || chat.length === 0) {
    fail("Booking detail — messages link", "No chat messages");
    return;
  }
  ok(`Booking detail — messages thread (${chat.length} message(s))`);

  const artistSession = await login("artist@stagebook.test");
  const { payload: artistBookings } = await request("/api/bookings/me", { token: artistSession.token });
  const inbox = artistBookings.filter((b) => b.status === "request_sent");
  const inInbox = inbox.some((b) => b.id === bookingId);
  if (!inInbox) {
    fail("Artist inbox — request appears", `Inbox size ${inbox.length}`);
    return;
  }
  ok("Artist inbox — new request visible for review");

  const decision = await request(`/api/bookings/${bookingId}/decision`, {
    method: "POST",
    token: artistSession.token,
    body: { status: "agreement" }
  });
  if (!decision.response.ok || decision.payload.booking?.status !== "agreement") {
    fail("Booking detail — artist accept offer", decision.payload.message ?? decision.response.status);
    return;
  }
  ok("Booking detail — artist accepts offer → agreement");

  console.log(`\n  Flow: discover → artist/${artist.id} → bookings/new → bookings/${bookingId.slice(0, 8)}…`);
}

async function main() {
  console.log("StageBook mobile booking flow smoke test");
  console.log(`Metro: ${METRO}  API: ${API}`);

  await smokeMetro();
  await smokeBookingFlow();

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});