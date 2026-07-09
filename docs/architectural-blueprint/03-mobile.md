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