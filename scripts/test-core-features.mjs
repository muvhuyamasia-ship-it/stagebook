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
  return `2026-12-${String(day).padStart(2, "0")}`;
}

async function runCoreFlow(label, base, eventDate = uniqueDate()) {
  console.log(`\n=== ${label} (${eventDate}) ===`);

  const client = await login(base, "client@stagebook.test");
  ok(`${label}: client login`);

  const artistId = (await request(base, "/api/artists")).payload[0]?.id;
  if (!artistId) {
    fail(`${label}: list artists`, "No artists");
    return null;
  }

  const { response: createRes, payload: created } = await request(base, "/api/bookings", {
    method: "POST",
    token: client.token,
    body: {
      artistProfileId: artistId,
      eventName: `Core E2E ${label}`,
      eventType: "Corporate",
      eventDate,
      startTime: "18:00",
      endTime: "20:00",
      locationLabel: "Sandton Convention Centre",
      latitude: -26.107,
      longitude: 28.054,
      guestCount: 100,
      quotedPriceZar: 24000
    }
  });
  if (!createRes.ok) {
    fail(`${label}: create booking`, created.message ?? createRes.status);
    return null;
  }
  const bookingId = created.booking.id;
  ok(`${label}: create booking`);

  const { response: msgRes } = await request(base, `/api/bookings/${bookingId}/chat`, {
    method: "POST",
    token: client.token,
    body: { body: "Please confirm soundcheck at 17:00." }
  });
  if (!msgRes.ok) {
    fail(`${label}: client message`, msgRes.status);
    return null;
  }
  ok(`${label}: messages — client sends text`);

  const artist = await login(base, "artist@stagebook.test");
  const { response: counterChatRes } = await request(base, `/api/bookings/${bookingId}/chat`, {
    method: "POST",
    token: artist.token,
    body: {
      body: "Counter-offer: R25,500 · 18:00–20:00 · Percussion add-on",
      systemAction: "counter_offer"
    }
  });
  if (!counterChatRes.ok) {
    fail(`${label}: messages — counter-offer chat`, counterChatRes.status);
    return null;
  }
  ok(`${label}: messages — artist counter-offer tile`);

  const { response: decisionRes } = await request(base, `/api/bookings/${bookingId}/decision`, {
    method: "POST",
    token: artist.token,
    body: { status: "agreement", counterPriceZar: 25500 }
  });
  if (!decisionRes.ok) {
    fail(`${label}: messages — artist decision`, decisionRes.status);
    return null;
  }
  ok(`${label}: messages — negotiation to agreement`);

  const { payload: chat } = await request(base, `/api/bookings/${bookingId}/chat`, {
    token: client.token
  });
  if (!Array.isArray(chat) || chat.length < 2) {
    fail(`${label}: messages — thread`, `Expected ≥2 messages, got ${chat?.length ?? 0}`);
    return null;
  }
  ok(`${label}: messages — thread has ${chat.length} messages`);

  const { response: genRes, payload: contract } = await request(
    base,
    `/api/bookings/${bookingId}/contracts/generate`,
    { method: "POST", token: client.token }
  );
  if (!genRes.ok) {
    fail(`${label}: contract — generate`, contract.message ?? genRes.status);
    return null;
  }
  ok(`${label}: contract — generated`);

  const clientSig = "data:image/png;base64,CLIENT_SIG";
  const { response: clientSignRes, payload: afterClientSign } = await request(
    base,
    `/api/bookings/${bookingId}/contracts/sign`,
    {
      method: "POST",
      token: client.token,
      body: { method: "draw", value: clientSig }
    }
  );
  if (!clientSignRes.ok || !afterClientSign.clientSignature) {
    fail(`${label}: contract — client signature`, afterClientSign.message ?? clientSignRes.status);
    return null;
  }
  ok(`${label}: contract — client signed`);

  const artistSig = "data:image/png;base64,ARTIST_SIG";
  const { response: artistSignRes, payload: signedContract } = await request(
    base,
    `/api/bookings/${bookingId}/contracts/sign`,
    {
      method: "POST",
      token: artist.token,
      body: { method: "draw", value: artistSig }
    }
  );
  if (!artistSignRes.ok || signedContract.status !== "signed") {
    fail(`${label}: contract — dual signature finalize`, signedContract.message ?? artistSignRes.status);
    return null;
  }
  ok(`${label}: contract — dual signatures finalized`);

  const { response: getContractRes } = await request(base, `/api/bookings/${bookingId}/contracts`, {
    token: client.token
  });
  if (!getContractRes.ok) {
    fail(`${label}: contract — GET`, getContractRes.status);
    return null;
  }
  ok(`${label}: contract — GET returns signed record`);

  const { response: checkoutRes, payload: checkout } = await request(
    base,
    `/api/bookings/${bookingId}/payments/checkout`,
    { method: "POST", token: client.token, body: { phase: "deposit" } }
  );
  if (!checkoutRes.ok || checkout.provider !== "payfast" || checkout.phase !== "deposit") {
    fail(`${label}: PayFast — deposit checkout`, checkout.message ?? checkoutRes.status);
    return null;
  }
  ok(`${label}: PayFast — deposit checkout (R${checkout.amountZar})`);

  const { response: depositRes, payload: afterDeposit } = await request(
    base,
    `/api/bookings/${bookingId}/payments/sandbox/complete`,
    { method: "POST", token: client.token, body: { phase: "deposit" } }
  );
  if (!depositRes.ok || afterDeposit.booking?.status !== "paid") {
    fail(`${label}: PayFast — deposit complete`, afterDeposit.message ?? depositRes.status);
    return null;
  }
  ok(`${label}: PayFast — deposit paid, calendar locked (status: paid)`);

  const { response: balanceCheckoutRes, payload: balanceCheckout } = await request(
    base,
    `/api/bookings/${bookingId}/payments/checkout`,
    { method: "POST", token: client.token, body: { phase: "balance" } }
  );
  if (!balanceCheckoutRes.ok || balanceCheckout.phase !== "balance") {
    fail(`${label}: PayFast — balance checkout`, balanceCheckout.message ?? balanceCheckoutRes.status);
    return null;
  }
  ok(`${label}: PayFast — balance checkout (R${balanceCheckout.amountZar})`);

  const { response: balanceRes, payload: afterBalance } = await request(
    base,
    `/api/bookings/${bookingId}/payments/sandbox/complete`,
    { method: "POST", token: client.token, body: { phase: "balance" } }
  );
  if (!balanceRes.ok || afterBalance.booking?.status !== "confirmed") {
    fail(`${label}: PayFast — balance complete`, afterBalance.message ?? balanceRes.status);
    return null;
  }
  ok(`${label}: PayFast — booking confirmed`);

  const paymentTile = (await request(base, `/api/bookings/${bookingId}/chat`, { token: client.token }))
    .payload;
  if (!paymentTile.some((m) => m.systemAction === "payment")) {
    fail(`${label}: PayFast — payment tile in chat`, "No payment system message");
    return null;
  }
  ok(`${label}: PayFast — payment milestone in message history`);

  return bookingId;
}

async function testWebPages() {
  console.log("\n=== Web UI routes ===");
  const pages = [
    "/",
    "/login",
    "/app/messages",
    "/app/bookings"
  ];
  for (const path of pages) {
    const res = await fetch(`${WEB}${path}`);
    if (res.ok) ok(`Web ${path} (${res.status})`);
    else fail(`Web ${path}`, String(res.status));
  }
}

async function main() {
  console.log("StageBook core features E2E — messages, contracts, PayFast");
  console.log(`API: ${API}  Web: ${WEB}`);

  await runCoreFlow("Direct API", API);
  await runCoreFlow("Web proxy", WEB);
  await testWebPages();
  const metro = await fetch("http://localhost:8081/");
  console.log("\n=== Mobile (Metro + API) ===");
  if (metro.ok) ok("Mobile Metro responds");
  else fail("Mobile Metro", String(metro.status));
  await runCoreFlow("Mobile API", API);

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});