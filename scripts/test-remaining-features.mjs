#!/usr/bin/env node

const API = process.env.API_BASE_URL ?? "http://localhost:4000";
const WEB = process.env.WEB_BASE_URL ?? "http://localhost:5174";

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

async function login(base, email) {
  const { response, payload } = await request(base, "/api/auth/login", {
    method: "POST",
    body: { email, password: "password123" }
  });
  if (!response.ok) throw new Error(`Login failed for ${email}: ${payload.message ?? response.status}`);
  return payload;
}

let dateCounter = 0;
function uniqueDate() {
  dateCounter += 1;
  const day = 10 + ((Date.now() + dateCounter) % 18);
  return `2026-11-${String(day).padStart(2, "0")}`;
}

async function runArtistDashboardFlow(label, base) {
  console.log(`\n=== ${label}: Artist dashboard ===`);

  const artist = await login(base, "artist@stagebook.test");
  ok(`${label}: artist login`);

  const { response: meRes, payload: profile } = await request(base, "/api/artists/me", {
    token: artist.token
  });
  if (!meRes.ok || !profile.id) {
    fail(`${label}: GET /artists/me`, profile.message ?? meRes.status);
    return null;
  }
  ok(`${label}: GET /artists/me — ${profile.stageName}`);

  const { response: updateRes, payload: updated } = await request(base, "/api/artists/me", {
    method: "PUT",
    token: artist.token,
    body: {
      stageName: `${profile.stageName} (API)`,
      bio: profile.bio,
      city: profile.city,
      province: profile.province,
      basePriceZar: profile.basePriceZar + 500,
      genres: profile.genres,
      latitude: profile.latitude,
      longitude: profile.longitude,
      media: profile.media,
      bankAccountLinked: true
    }
  });
  if (!updateRes.ok || !updated.stageName?.includes("(API)")) {
    fail(`${label}: PUT /artists/me`, updated.message ?? updateRes.status);
    return null;
  }
  ok(`${label}: PUT /artists/me — profile updated`);

  const { response: verifySubmitRes } = await request(
    base,
    `/api/artists/${profile.id}/verification`,
    {
      method: "POST",
      token: artist.token,
      body: {
        southAfricanIdNumber: "9001015800084",
        idDocumentUrl: "https://docs.stagebook.local/id.pdf",
        faceScanUrl: "https://docs.stagebook.local/face.jpg"
      }
    }
  );
  if (!verifySubmitRes.ok) {
    fail(`${label}: POST verification`, verifySubmitRes.status);
    return null;
  }
  ok(`${label}: verification submitted`);

  const { response: verifyApproveRes, payload: verified } = await request(
    base,
    `/api/artists/${profile.id}/verification/approve`,
    { method: "POST", token: artist.token }
  );
  if (!verifyApproveRes.ok || verified.status !== "verified") {
    fail(`${label}: verification approve`, verified.message ?? verifyApproveRes.status);
    return null;
  }
  ok(`${label}: verification approved`);

  const { response: balancesRes, payload: balances } = await request(
    base,
    `/api/artists/${profile.id}/payouts/balances`,
    { token: artist.token }
  );
  if (!balancesRes.ok || typeof balances.availableBalanceZar !== "number") {
    fail(`${label}: payout balances`, balances.message ?? balancesRes.status);
    return null;
  }
  ok(`${label}: payout balances — available R${balances.availableBalanceZar}`);

  return profile.id;
}

async function runCompleteBookingFlow(label, base, artistProfileId) {
  console.log(`\n=== ${label}: Complete booking + payout ===`);
  const eventDate = uniqueDate();

  const client = await login(base, "client@stagebook.test");
  const artist = await login(base, "artist@stagebook.test");

  const { response: createRes, payload: created } = await request(base, "/api/bookings", {
    method: "POST",
    token: client.token,
    body: {
      artistProfileId,
      eventName: `Complete flow ${label}`,
      eventType: "Corporate",
      eventDate,
      startTime: "18:00",
      endTime: "20:00",
      locationLabel: "Cape Town ICC",
      latitude: -33.9,
      longitude: 18.4,
      guestCount: 80,
      quotedPriceZar: 32000
    }
  });
  if (!createRes.ok) {
    fail(`${label}: create booking`, created.message ?? createRes.status);
    return;
  }
  const bookingId = created.booking.id;
  ok(`${label}: booking created`);

  await request(base, `/api/bookings/${bookingId}/decision`, {
    method: "POST",
    token: artist.token,
    body: { status: "agreement" }
  });
  ok(`${label}: agreement reached`);

  await request(base, `/api/bookings/${bookingId}/contracts/generate`, {
    method: "POST",
    token: client.token
  });
  await request(base, `/api/bookings/${bookingId}/contracts/sign`, {
    method: "POST",
    token: client.token,
    body: { method: "draw", value: "CLIENT_SIG" }
  });
  await request(base, `/api/bookings/${bookingId}/contracts/sign`, {
    method: "POST",
    token: artist.token,
    body: { method: "draw", value: "ARTIST_SIG" }
  });
  ok(`${label}: contract signed`);

  await request(base, `/api/bookings/${bookingId}/payments/sandbox/complete`, {
    method: "POST",
    token: client.token,
    body: { phase: "deposit" }
  });
  await request(base, `/api/bookings/${bookingId}/payments/sandbox/complete`, {
    method: "POST",
    token: client.token,
    body: { phase: "balance" }
  });
  ok(`${label}: payments complete (confirmed)`);

  const { response: completeRes, payload: completed } = await request(
    base,
    `/api/bookings/${bookingId}/complete`,
    { method: "POST", token: artist.token }
  );
  if (!completeRes.ok || completed.booking?.status !== "completed") {
    fail(`${label}: POST /complete`, completed.message ?? completeRes.status);
    return;
  }
  ok(`${label}: booking marked complete`);

  const { payload: balancesAfter } = await request(
    base,
    `/api/artists/${artistProfileId}/payouts/balances`,
    { token: artist.token }
  );
  if (balancesAfter.availableBalanceZar < 32000) {
    fail(
      `${label}: balance after complete`,
      `Expected ≥32000, got ${balancesAfter.availableBalanceZar}`
    );
    return;
  }
  ok(`${label}: available balance includes completed booking`);

  const { response: payoutRes, payload: payout } = await request(
    base,
    `/api/artists/${artistProfileId}/payouts/request`,
    {
      method: "POST",
      token: artist.token,
      body: { amountZar: 5000 }
    }
  );
  if (!payoutRes.ok || !payout.id) {
    fail(`${label}: payout request`, payout.message ?? payoutRes.status);
    return;
  }
  ok(`${label}: payout requested — R${payout.amountZar}`);

  const { payload: payoutList } = await request(
    base,
    `/api/artists/${artistProfileId}/payouts`,
    { token: artist.token }
  );
  if (!Array.isArray(payoutList) || payoutList.length === 0) {
    fail(`${label}: payout history`, "Empty list");
    return;
  }
  ok(`${label}: payout history — ${payoutList.length} record(s)`);
}

async function testWebRoutes() {
  console.log("\n=== Web UI routes (remaining features) ===");
  const pages = [
    "/app/profile/edit",
    "/app/earnings",
    "/app/bookings/new?artist=artist-1"
  ];
  for (const path of pages) {
    const res = await fetch(`${WEB}${path}`);
    if (res.ok) ok(`Web ${path} (${res.status})`);
    else fail(`Web ${path}`, String(res.status));
  }
}

async function main() {
  console.log("StageBook remaining features — artist profile, calendar, payouts, complete");
  console.log(`API: ${API}  Web: ${WEB}`);

  const artistId = await runArtistDashboardFlow("Direct API", API);
  if (artistId) await runCompleteBookingFlow("Direct API", API, artistId);

  const artistIdWeb = await runArtistDashboardFlow("Web proxy", WEB);
  if (artistIdWeb) await runCompleteBookingFlow("Web proxy", WEB, artistIdWeb);

  await testWebRoutes();

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});