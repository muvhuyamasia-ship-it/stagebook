CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('artist', 'representative', 'client');
CREATE TYPE booking_status AS ENUM ('request_sent', 'agreement', 'paid', 'confirmed', 'declined', 'cancelled', 'completed');
CREATE TYPE contract_status AS ENUM ('draft', 'pending_signatures', 'signed', 'revision_requested');
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'captured', 'released', 'refunded');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE media_type AS ENUM ('image', 'video');
CREATE TYPE signature_method AS ENUM ('draw', 'type');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE artist_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  bio TEXT NOT NULL,
  genres TEXT[] NOT NULL DEFAULT '{}',
  base_price_zar INTEGER NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  bank_account_linked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE artist_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_profile_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  type media_type NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE representative_artist_links (
  representative_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_profile_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (representative_user_id, artist_profile_id)
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_profile_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  representative_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location_label TEXT NOT NULL,
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,
  guest_count INTEGER NOT NULL,
  special_requests TEXT,
  technical_rider TEXT,
  quoted_price_zar INTEGER NOT NULL,
  status booking_status NOT NULL DEFAULT 'request_sent',
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX bookings_artist_date_idx ON bookings (artist_profile_id, event_date);

CREATE TABLE booking_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  system_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_reference TEXT NOT NULL UNIQUE,
  total_amount_zar INTEGER NOT NULL,
  deposit_amount_zar INTEGER NOT NULL,
  balance_amount_zar INTEGER NOT NULL,
  platform_fee_zar INTEGER NOT NULL,
  artist_net_zar INTEGER NOT NULL,
  balance_due_at TIMESTAMPTZ NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  refund_percentage NUMERIC(4,2) NOT NULL,
  refund_amount_zar INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  body_markdown TEXT NOT NULL,
  pdf_url TEXT,
  status contract_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE contract_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  signer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signer_role user_role NOT NULL,
  method signature_method NOT NULL,
  value TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE identity_verifications (
  artist_profile_id UUID PRIMARY KEY REFERENCES artist_profiles(id) ON DELETE CASCADE,
  south_african_id_number TEXT NOT NULL,
  id_document_url TEXT NOT NULL,
  face_scan_url TEXT NOT NULL,
  status verification_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_profile_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  amount_zar INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
