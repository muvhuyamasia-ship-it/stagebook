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