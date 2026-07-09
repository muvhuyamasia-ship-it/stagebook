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