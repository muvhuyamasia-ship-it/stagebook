#!/usr/bin/env bash
set -euo pipefail

BOOKING_ID="${BOOKING_ID:-ff422363-317e-4ed5-9de5-2c357ed6e5b1}"
UDID="${UDID:-$(xcrun simctl list devices booted | grep -oE '[A-F0-9-]{36}' | head -1)}"
BASE="exp://127.0.0.1:8081"
SHOT="$(cd "$(dirname "$0")/.." && pwd)/scripts/.smoke-screenshots"

open -a Simulator 2>/dev/null || true

echo "Client signature"
xcrun simctl openurl "$UDID" "$BASE/--/login?demo=client"
sleep 5
xcrun simctl openurl "$UDID" "$BASE/--/bookings/${BOOKING_ID}/contract?generate=1&sign=1"
sleep 5
xcrun simctl io "$UDID" screenshot "$SHOT/contract-client-signed.png" 2>&1 | tail -1

echo "Artist signature"
xcrun simctl openurl "$UDID" "$BASE/--/login?demo=artist"
sleep 5
xcrun simctl openurl "$UDID" "$BASE/--/bookings/${BOOKING_ID}/contract?sign=1"
sleep 5
xcrun simctl io "$UDID" screenshot "$SHOT/contract-signed.png" 2>&1 | tail -1

echo "Done"