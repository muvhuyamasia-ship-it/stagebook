# 1. Monorepo Topology

```
stagebook/
├── apps/
│   ├── api/                  # Express REST API (source of truth)
│   ├── mobile/               # Expo SDK 52 + expo-router
│   ├── stagebook-web/        # Vite + React Router dashboard (port 5174)
│   └── web/                  # Marketing site (port 5173)
├── packages/
│   └── shared/               # Types, business rules, API client factory
└── scripts/                  # Simulator smoke / E2E helpers
```

**Data flow:** Clients use `createStagebookApi()` from `@stagebook/shared`, attach JWT from session storage, mirror server state in `StageBookContext`. No Redux/Zustand.

---

# 2. `packages/shared` — File Structure

```
packages/shared/
├── package.json
└── src/
    ├── index.ts              # Canonical domain types + re-exports
    ├── business-logic.ts     # Payment, refund, travel-gap, overlap math
    ├── messaging.ts          # Counter-offers, threads, booking context
    ├── stagebook-api.ts      # Typed fetch wrapper (createStagebookApi)
    ├── payfast.ts            # PayFast sandbox checkout builder
    ├── calendar.ts           # Month grid builder
    ├── navigation.ts         # Tab definitions + role filtering
    ├── design-tokens.ts      # Shared visual tokens
    └── mock-catalog.ts       # DiscoveryFilters defaults + seed mocks
```

## 2.1 `index.ts` — Domain Model

**Constants:**
- `STAGEBOOK_TIME_SLOTS`: 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00
- `BookingStatus`: request_sent → agreement → paid → confirmed → completed (+ declined, cancelled)
- `ContractStatus`: draft | pending_signatures | signed | revision_requested
- `UserRole`: artist | representative | client | admin

**Core interfaces:** User, ArtistProfile, BookingRequest, ChatMessage, ContractRecord, PaymentSchedule, PayoutBalances, SiteContent, ContactThread, etc.

## 2.2 `business-logic.ts`

| Function | Logic |
|----------|-------|
| `buildPaymentSchedule(total, eventDate)` | Deposit 30%, balance 70%, platform fee 5%, artist net = total − fee. Balance due = event date − 48h UTC. |
| `calculateCancellationRefund(total, eventDate, cancelledAt)` | ≥14 days → 100%; 7–13 → 75%; <7 → 50%. |
| `assessTravelGap(candidate, existing, minutesPerKm=2)` | Same-day haversine transit. `blocked` if gap < 60% required; `warning` if gap < required. |
| `slotOverlaps(aStart, aEnd, bStart, bEnd)` | Interval overlap on minute grid. |
| `formatZar(amount)` | R{en-ZA locale} |

**Rates:** DEPOSIT_RATE=0.3, BALANCE_RATE=0.7, PLATFORM_COMMISSION_RATE=0.05

## 2.3 `messaging.ts`

| Function | Logic |
|----------|-------|
| `isNegotiatingStatus(status)` | request_sent or agreement |
| `buildBookingContext(booking, artistName)` | 7 fields: artist, event, date, time, venue, offer, guests |
| `buildMessageThreads({...})` | Excludes declined/cancelled; unread from readAtByBooking; filters all/negotiating/unread |
| `formatCounterOfferBody(offer)` | `Counter-offer: R{price} · {start}–{end} · {note?}` |
| `deriveCounterOffersFromChat(messages)` | Regex parse; accept/decline updates status; latest pending per booking only |

## 2.4 `stagebook-api.ts` — `createStagebookApi(config)`

**Transport:** `request<T>()` — JSON fetch, Bearer token, throws `StagebookApiError`.

**26 API methods:** listArtists, listMyBookings, createBooking, bookingDecision, cancelBooking, listChat, sendChat, getContract, generateContract, requestContractRevision, signContract, createPayfastCheckout, completePayfastSandbox, getMyArtistProfile, updateArtistProfile, getVerification, submitVerification, approveVerification, getPayoutBalances, listPayouts, requestPayout, completeBooking.

**BookingDecisionInput:** `{ status, counterPriceZar?, counterStartTime?, counterEndTime? }`

## 2.5 `payfast.ts`

`buildPayfastCheckoutSession(...)` — Sandbox merchant 10000100; form fields for sandbox.payfast.co.za; reference `stagebook_{bookingId}_{phase}`.

## 2.6 `calendar.ts`

`buildCalendarMonth(...)` — One cell per day with state from injected `getCalendarState` + bookingCount.

## 2.7 `navigation.ts`

`STAGEBOOK_APP_TABS` — discover, search, bookings, messages, profile, earnings (artist/rep). `tabsForRole(role)` filters by role.

## 2.8 `mock-catalog.ts`

`DiscoveryFilters`: query, date, minBudget (5000), maxBudget (100000), genre, radiusKm (50), city (Johannesburg). Static MOCK_* for offline dev.