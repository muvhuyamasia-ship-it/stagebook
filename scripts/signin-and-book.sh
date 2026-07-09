#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UDID="${UDID:-$(xcrun simctl list devices booted | grep -oE '[A-F0-9-]{36}' | head -1)}"
SHOT="$ROOT/scripts/.smoke-screenshots"
ARTIST_ID="${ARTIST_ID:-$(curl -s http://localhost:4000/api/artists | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")}"
BASE="exp://127.0.0.1:8081"

mkdir -p "$SHOT"
open -a Simulator 2>/dev/null || true

echo "Signing in as demo client"
xcrun simctl openurl "$UDID" "$BASE/--/login?demo=client"
sleep 6
xcrun simctl io "$UDID" screenshot "$SHOT/signin-discover.png" 2>&1 | tail -1

echo "Submitting booking for artist $ARTIST_ID"
xcrun simctl openurl "$UDID" "$BASE/--/bookings/new?artist=${ARTIST_ID}&step=4&submit=true"
sleep 5
xcrun simctl io "$UDID" screenshot "$SHOT/booking-submitted.png" 2>&1 | tail -1

echo "Done"