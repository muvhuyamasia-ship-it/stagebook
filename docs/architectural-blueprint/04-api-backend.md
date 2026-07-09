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