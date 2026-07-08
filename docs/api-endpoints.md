# StageBook API Endpoints

## Authentication

- `POST /api/auth/signup`
- `POST /api/auth/login`

## Artist discovery and profile

- `GET /api/artists`
- `GET /api/artists/:artistId`
- `PUT /api/artists/me`

## Bookings

- `GET /api/bookings/me`
- `POST /api/bookings`
- `POST /api/bookings/:bookingId/decision`
- `POST /api/bookings/:bookingId/cancel`

## Chat

- `GET /api/bookings/:bookingId/chat`
- `POST /api/bookings/:bookingId/chat`

## Contracts

- `POST /api/bookings/:bookingId/contracts/generate`
- `POST /api/bookings/:bookingId/contracts/revision`
- `POST /api/bookings/:bookingId/contracts/sign`

## Payments

- `POST /api/bookings/:bookingId/payments/checkout`
- `POST /api/bookings/:bookingId/payments/deposit-paid`
- `POST /api/bookings/:bookingId/payments/confirm`

## Verification and payouts

- `POST /api/artists/:artistId/verification`
- `POST /api/artists/:artistId/verification/approve`
- `GET /api/artists/:artistId/payouts/balances`
- `POST /api/artists/:artistId/payouts/request`
