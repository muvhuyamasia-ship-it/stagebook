# StageBook Monorepo — Complete Architectural Blueprint

**Commit:** e6194f4 | **Date:** July 2026 | **For:** External audit

---

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
---

# 3. `apps/stagebook-web` — File Structure

```
apps/stagebook-web/
├── index.html
├── package.json
├── vite.config.ts              # port 5174
├── tsconfig.json
├── tsconfig.node.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── env.d.ts
    ├── theme/theme.ts
    ├── styles/global.css
    ├── types/auth.ts
    ├── lib/
    │   ├── api.ts
    │   ├── stagebook-api.ts
    │   ├── session.ts
    │   └── onboarding.ts
    ├── context/
    │   ├── AuthContext.tsx
    │   └── StageBookContext.tsx
    ├── components/
    │   ├── layout/             # AppShell, AuthShell, SiteNav
    │   ├── routing/            # RequireAuth, RequireVerification
    │   ├── auth/               # RoleSelector
    │   ├── ui/                 # Button, Field, LuxuryCard, SignaturePad
    │   ├── artists/            # ArtistCard
    │   ├── bookings/           # CalendarMonth
    │   ├── messages/           # Thread list, bubbles, TransactionHub
    │   ├── payments/           # PayfastSandboxModal
    │   ├── onboarding/         # Wizard, ID scan, biometric
    │   └── landing/            # BrandShowcase
    └── pages/
        ├── LandingPage.tsx, LoginPage.tsx, SignUpPage.tsx, OnboardingPage.tsx
        └── app/
            ├── DiscoverPage, SearchPage, BookingsPage, BookingDetailPage
            ├── BookingWizardPage, ChatThreadPage, MessagesPage
            ├── NotificationsPage, ContractPage, PaymentPage
            ├── ArtistProfilePage, ArtistEditorPage, ProfilePage, EarningsPage
```

## 3.1 Routing (`App.tsx`)

- **Public:** `/`, `/login`, `/signup`
- **Protected:** `/onboarding` (auth only)
- **Verified app:** `/app/*` under RequireAuth + RequireVerification + StageBookProvider

**App routes:** discover, search, bookings (+ new, :id, :id/chat, :id/contract, :id/payment), messages, notifications, profile, profile/edit, earnings, artists/:artistId

## 3.2 `AuthContext.tsx`

| Member | Behavior |
|--------|----------|
| session | localStorage JWT on mount |
| isVerified | isOnboardingComplete(loadOnboarding(userId)) |
| login / signup | POST /api/auth/* → storeSession |
| logout | clearSession |
| refreshVerification | Re-evaluate onboarding tick |

**Gate:** Unverified users cannot reach `/app/*`.

## 3.3 `StageBookContext.tsx` — State Manager

**State:** artists, bookings, chatMessages, contracts, counterOffers (derived), notifications (local+seeded), readAtByBooking, filters, myArtistProfile, payoutBalances, payouts, verificationStatus, dataLoading, dataError

**Lifecycle:** On mount listArtists + refreshBookings; refreshBookings parallel-fetches bookings, all chats, all contracts.

### Read functions

getArtist, getBooking, getBookingChat, getMessageThreads, getBookingContext, getPendingCounterOffer, getCounterOffer, getContract, getPaymentSchedule (client buildPaymentSchedule), getCalendarState (past/booked/partial/available), filteredArtists (query, genre, budget, city), unreadMessageCount, unreadCount (notifications)

### Write functions

| Function | Business Logic |
|----------|----------------|
| createBooking | Pre-check slotOverlaps + assessTravelGap blocked; POST /bookings; system chat intro |
| sendMessage | POST /chat; local notification |
| sendCounterOffer | Artist/rep: bookingDecision first with price+times; always counter_offer chat |
| acceptCounterOffer | bookingDecision(agreement, price, times) + accept chat |
| declineCounterOffer | bookingDecision(declined) + decline chat |
| acceptOffer / declineOffer | agreement or declined without counter fields |
| generateContract / signContract / requestAmendment | Contract API + system chat on full sign |
| createPayfastCheckout / completePayfastPayment | Checkout session + sandbox complete |
| cancelBooking | POST cancel + refund notification |
| completeBooking | POST complete (artist/rep) |
| updateBookingStatus | **Local-only** — no API (audit flag) |
| markNotificationRead / markThreadRead | Local state |

## 3.4 Key Pages

| Page | Role |
|------|------|
| BookingWizardPage | 4-step draft → createBooking |
| ChatThreadPage + TransactionHub | Negotiation UI |
| ContractPage | Generate, sign (SignaturePad), amendment |
| PaymentPage | Deposit/balance + PayfastSandboxModal |
| EarningsPage | Payout balances + request |

## 3.5 Onboarding (`lib/onboarding.ts`)

Client-only localStorage. Steps: welcome → profile → idDocument → biometric. `isOnboardingComplete`: verificationStatus=verified AND completedAt set. **Independent of API artist KYC.**

## 3.6 `TransactionHub.tsx`

Controlled component: current terms, pending counter accept/decline, counter form (STAGEBOOK_TIME_SLOTS selects), accept/decline offer buttons.
---

# 4. `apps/mobile` — File Structure

```
apps/mobile/
├── app.json
├── babel.config.js             # react-native-reanimated plugin
├── package.json
├── tsconfig.json
├── app/
│   ├── _layout.tsx             # GestureHandler → Auth → StageBook → Sheets → Stack
│   ├── index.tsx
│   ├── login.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Blur tab bar
│   │   ├── discover.tsx, search.tsx, bookings.tsx
│   │   ├── messages.tsx, profile.tsx, earnings.tsx
│   ├── artists/[artistId].tsx
│   ├── bookings/
│   │   ├── new.tsx             # Deep-link shim → BookingWizardSheet
│   │   ├── [bookingId].tsx
│   │   └── [bookingId]/contract.tsx, payment.tsx
│   ├── messages/[bookingId].tsx
│   └── profile/edit.tsx
└── src/
    ├── components/             # BookingWizardSheet, BlurHeader, FloatingSurface, etc.
    ├── context/                # AuthContext, StageBookContext, SheetContext
    ├── lib/                    # api, stagebook-api, session, artistMedia
    └── theme/                  # theme.ts, typography.ts
```

## 4.1 Provider Stack

```
GestureHandlerRootView → SafeAreaProvider → AuthProvider → StageBookProvider → SheetProvider → Stack
```

## 4.2 `AuthContext.tsx`

Login/logout only. **No onboarding verification gate.**

## 4.3 `StageBookContext.tsx`

Parity with web on booking/chat/contract/payment. **Differences:**

| Aspect | Mobile |
|--------|--------|
| Notifications | Empty array |
| filteredArtists | stageName query only |
| refreshBookings | bookingsAreEqual shallow compare |
| updateBookingStatus | Not exposed |
| Thread polling | messages/[bookingId] refreshes every 5s |

All negotiation, contract, payment functions mirror web API calls and validation rules.

## 4.4 `SheetContext.tsx`

Globally mounts FiltersBottomSheet + BookingWizardSheet. `openBookingWizard(artistId, {step?, submit?})`.

**BookingWizardSheet defaults:** 2026-12-15, 18:00, 2h, Sandton, artist basePriceZar, "Annual Gala" on deep-link submit, guestCount 150.

## 4.5 Dev Deep-Link Automation

| Route | Params | Auto-action |
|-------|--------|-------------|
| /login | demo=client\|artist | Auto-login |
| /bookings/new | artist, step=1-4, submit=true | Open wizard; submit at step 4 |
| /messages/:id | send, counter=1, price, start, end, note, accept=1, acceptCounter=1 | One-shot useEffect + ref guards |
| /bookings/:id/contract | generate=1, sign=1 | Auto-generate + demo SVG sign |
| /bookings/:id/payment | pay=deposit\|balance | Auto checkout + sandbox complete |

## 4.6 Mobile Screen Inventory

| Route | Key Actions |
|-------|-------------|
| (tabs)/discover | Artist grid, filters sheet |
| (tabs)/bookings | List by status |
| (tabs)/messages | Thread inbox |
| artists/[artistId] | Book → wizard sheet |
| bookings/[bookingId] | Links to messages/contract/payment |
| messages/[bookingId] | Full negotiation hub (inline TransactionHub) |
| contract.tsx / payment.tsx | Same flows as web + dev query params |

## 4.7 Premium UI Components

FloatingSurface, PressableScale (Reanimated+haptics), BlurHeader, Skeleton, ArtistDiscoveryCard, FiltersBottomSheet, BookingWizardSheet, ChatMessageBubble, SignaturePad.

## 4.8 Mobile vs Web Parity

| Capability | Web | Mobile |
|------------|-----|--------|
| Onboarding gate | Yes | No |
| Local notifications | Yes | No |
| Full discovery filters | Yes | Name only |
| Booking wizard | Full page | Bottom sheet |
| Dev deep links | No | Yes |
| updateBookingStatus | Yes (local) | No |
---

# 5. `apps/api` — Backend Architecture

## 5.1 File Structure

```
apps/api/
├── tests/                      # vitest: booking, auth, contact, payout, site
└── src/
    ├── server.ts, app.ts
    ├── config/env.ts           # JWT_SECRET, PORT (default 4000)
    ├── lib/errors.ts, inMemoryStore.ts
    ├── middleware/auth.ts
    ├── routes/index.ts         # Monolithic apiRouter
    └── modules/
        ├── auth/               # signup, login, password reset
        ├── artists/
        ├── bookings/           # BookingService
        ├── chat/
        ├── contracts/          # ContractService
        ├── payments/           # PaymentService + PayfastService
        ├── payouts/
        ├── verification/
        ├── notifications/
        ├── contact/
        └── site/
```

## 5.2 Persistence (`inMemoryStore`)

| Collection | Purpose |
|------------|---------|
| users, artists, representativeLinks | Auth + profiles |
| bookings, chatMessages, contracts | Transaction data |
| verifications, payouts | Artist KYC + withdrawals |
| siteContent, contactThreads | CMS + contact |
| passwordResetTokens | 30-min reset tokens |

**seedData()** on boot: artist@stagebook.test, rep@stagebook.test, client@stagebook.test (password123), Luna Vibe profile, rep link.

**Data resets on API restart.**

## 5.3 `BookingService`

| Method | Rules |
|--------|-------|
| validateTimeslot | Start in STAGEBOOK_TIME_SLOTS; duration ≥2h, whole hours |
| create | 409 on same-artist same-day overlap; optional travelWarning (non-blocking) |
| transitionStatus | On agreement: optional quotedPriceZar, startTime+endTime (both required if either set); rebuilds payment schedule |
| cancel | Reason required; refund % by days-until-event |
| canUserAccess | Client owner, artist owner, or linked rep |
| canManageBooking | Artist owner or linked rep |

## 5.4 `ContractService`

| Method | Logic |
|--------|-------|
| generate | Idempotent; markdown from artist/client/event/payment/cancellation; status pending_signatures |
| sign | client → clientSignature; artist/rep → artistSignature; both → signed + mock pdfUrl |
| requestRevision | status revision_requested; append feedback to markdown |

## 5.5 `PaymentService` + `PayfastService`

| Method | Status transition |
|--------|-------------------|
| createCheckout(deposit) | May force agreement if not already in agreement/paid/confirmed |
| completeSandboxPayment(deposit) | → paid |
| completeSandboxPayment(balance) | → confirmed |

Shortcuts: POST deposit-paid, POST confirm (balance).

## 5.6 Other Services

**ChatService:** list + send only; no edit/delete; no server read receipts.

**PayoutService:** available = sum completed bookings; pending = sum paid+confirmed; request requires verified KYC + sufficient available.

**VerificationService:** submit → pending; markVerified callable by artist (demo).

**AuthService:** email regex; password ≥8; no admin signup; bcrypt passwords; JWT issue.

## 5.7 REST API Catalog

**Auth:** POST signup, login, forgot-password, reset-password; GET me

**Site:** GET/PUT content; contact thread CRUD + replies

**Artists:** GET list (filters), GET :id, GET/PUT me (artist)

**Bookings:** GET me; POST create (client); POST decision; POST cancel; POST complete

**Chat:** GET/POST /bookings/:id/chat

**Contracts:** GET; POST generate, revision, sign

**Payments:** POST checkout, sandbox/complete, deposit-paid, confirm; GET payfast return/cancel HTML

**Verification:** GET/POST /artists/:id/verification; POST approve

**Payouts:** GET balances, list; POST request

## 5.8 Auth Middleware

- `requireAuth` — Bearer JWT verify
- `attachAuthIfPresent` — optional auth
- `requireRole([...])` — role gate

JWT payload: `{ userId, role, email }`. No refresh token.
---

# 6. Booking Lifecycle State Machine

```
request_sent ──accept/counter-accept──► agreement
     │                                      │
     decline                                │ deposit
     ▼                                      ▼
 declined                                 paid
                                             │ balance
                                             ▼
                                        confirmed ──► completed
                                             │
                                        cancel ──► cancelled
```

## 6.1 Counter-Offer Logical Model

Not a separate API entity. Stored as chat (`systemAction: counter_offer`). Parsed by `deriveCounterOffersFromChat`. Accept calls `POST /decision` with price + times. Latest pending per booking only.

## 6.2 Payment Flow (Clients)

```
createPayfastCheckout(phase) → POST /payments/checkout → PayfastCheckoutSession
completePayfastPayment(phase) → POST /sandbox/complete → status paid|confirmed + system chat
```

Schedule computed client-side via `buildPaymentSchedule(quotedPriceZar, eventDate)`.

## 6.3 Calendar Availability (Client)

| Condition | State |
|-----------|-------|
| date < today | past |
| paid/confirmed on date | booked |
| ≥3 bookings on date | booked |
| ≥1 booking | partial |
| else | available |

Server hard-blocks overlap only at create.

## 6.4 Validation Matrix

| Check | Client | Server |
|-------|--------|--------|
| Slot grid + 2h duration | UI chips | validateTimeslot |
| Overlap | slotOverlaps pre-check | 409 on create |
| Travel gap block | assessTravelGap.blocked | warning only |
| Counter body format | regex derive | — |
| Cancellation reason | — | required |
| Contract before payment | UI flow | not enforced |
| Onboarding gate | web only | — |

## 6.5 Security Access Matrix

| Resource | Client | Artist | Rep | Admin |
|----------|--------|--------|-----|-------|
| Create booking | ✓ | — | — | — |
| Manage decision | accept/decline own | ✓ | ✓ | — |
| Read/chat | own | own artist | linked | — |
| PayFast | ✓ | — | — | — |
| Complete booking | — | ✓ | ✓ | — |
| Payout | — | verified | — | — |
| Site CMS | — | — | — | ✓ |

## 6.6 Error Handling

- API: AppError → JSON `{ message }` + status
- Clients: StagebookApiError → dataError string
- Silent: loadContract 404, refreshThread poll failures, listArtists empty on error

## 6.7 Testing

- `npm run test` — API vitest
- `npm run test:all` — orchestrator + API restart
- `npm run smoke:ios` — simulator smoke
- `npm run typecheck` — all workspaces
- No automated web/mobile UI E2E in CI

## 6.8 Audit Risk Register

| ID | Risk | Severity |
|----|------|----------|
| R1 | In-memory store — no durability | High |
| R2 | Dev deep-links in mobile production routes | Medium |
| R3 | Artist self-approves KYC | Medium |
| R4 | updateBookingStatus local desync (web) | Low |
| R5 | Travel gap blocked client-only | Medium |
| R6 | Payment without signed contract (server) | Medium |
| R7 | Counter-offer regex parse fragility | Medium |
| R8 | No refresh token / revocation | Medium |
| R9 | Web onboarding vs API KYC disconnected | Low |
| R10 | Mobile notifications non-functional | Low |

## 6.9 Glossary

| Term | Definition |
|------|------------|
| Agreement | Negotiation done; precedes payment |
| Escrow deposit | 30% sandbox payment → paid |
| Balance | 70% → confirmed |
| StageBook slot | 2-hour block on fixed grid |
| Sandbox complete | Dev shortcut bypassing real PayFast POST |

## 6.10 Environment

| Variable | Default |
|----------|---------|
| JWT_SECRET | dev fallback |
| PORT | 4000 |
| VITE_API_BASE_URL | http://localhost:4000 |
| stagebook-web vite port | 5174 |
| mobile Metro | 8081 |