import type {
  ArtistProfile,
  AvailabilityStatus,
  BookingRequest,
  BookingStatus,
  ChatMessage,
  ContractRecord,
  UserRole
} from "./index";
import type { CounterOffer } from "./messaging";

export interface DiscoveryFilters {
  query: string;
  date: string;
  minBudget: number;
  maxBudget: number;
  genre: string;
  radiusKm: number;
  city: string;
}

export const DEFAULT_DISCOVERY_FILTERS: DiscoveryFilters = {
  query: "",
  date: "",
  minBudget: 5000,
  maxBudget: 100000,
  genre: "all",
  radiusKm: 50,
  city: "Johannesburg"
};

export const MOCK_ARTISTS: ArtistProfile[] = [
  {
    id: "artist-1",
    userId: "user-artist-1",
    stageName: "Luna Vibe",
    bio: "Afro-house curator blending live percussion with premium club energy for corporate and private events.",
    genres: ["Afro House", "DJ", "Live Percussion"],
    basePriceZar: 18000,
    city: "Johannesburg",
    province: "Gauteng",
    latitude: -26.1076,
    longitude: 28.0567,
    rating: 4.9,
    reviewCount: 120,
    media: [{ id: "m1", type: "image", url: "/media/luna-vibe.jpg" }],
    availabilityStatus: "available",
    bankAccountLinked: true
  },
  {
    id: "artist-2",
    userId: "user-artist-2",
    stageName: "The Velvet Horns",
    bio: "Eight-piece jazz and soul ensemble delivering refined performances for weddings and gala evenings.",
    genres: ["Jazz", "Soul", "Live Band"],
    basePriceZar: 24500,
    city: "Pretoria",
    province: "Gauteng",
    latitude: -25.7479,
    longitude: 28.2293,
    rating: 4.8,
    reviewCount: 86,
    media: [{ id: "m2", type: "image", url: "/media/velvet-horns.jpg" }],
    availabilityStatus: "limited",
    bankAccountLinked: true
  },
  {
    id: "artist-3",
    userId: "user-artist-3",
    stageName: "Naledi Strings",
    bio: "Classical-crossover string quartet available for luxury brand activations and intimate ceremonies.",
    genres: ["Classical", "Crossover", "Ceremony"],
    basePriceZar: 16000,
    city: "Sandton",
    province: "Gauteng",
    latitude: -26.107,
    longitude: 28.054,
    rating: 4.95,
    reviewCount: 54,
    media: [{ id: "m3", type: "image", url: "/media/naledi-strings.jpg" }],
    availabilityStatus: "available",
    bankAccountLinked: false
  }
];

export const MOCK_BOOKINGS: BookingRequest[] = [
  {
    id: "booking-1",
    artistProfileId: "artist-1",
    clientUserId: "client-1",
    eventName: "Aurum Corporate Gala",
    eventType: "Corporate",
    eventDate: "2026-08-14",
    startTime: "18:00",
    endTime: "20:00",
    locationLabel: "Sandton Convention Centre",
    latitude: -26.107,
    longitude: 28.054,
    guestCount: 320,
    specialRequests: "Extended opening set with percussionist",
    technicalRider: "DJ booth, in-ear monitors, 2x subs",
    quotedPriceZar: 28000,
    status: "request_sent"
  },
  {
    id: "booking-2",
    artistProfileId: "artist-2",
    clientUserId: "client-2",
    eventName: "Velvet Wedding Reception",
    eventType: "Wedding",
    eventDate: "2026-09-02",
    startTime: "16:00",
    endTime: "18:00",
    locationLabel: "The Manor House, Pretoria",
    latitude: -25.73,
    longitude: 28.21,
    guestCount: 180,
    quotedPriceZar: 32000,
    status: "agreement",
    travelWarning: "Travel time may be insufficient between afternoon soundcheck and evening slot."
  }
];

export const MOCK_CHAT: ChatMessage[] = [
  {
    id: "chat-0",
    bookingId: "booking-1",
    senderUserId: "client-1",
    senderRole: "client",
    body: "Hi Luna — we'd love a 2-hour Afro-house set with live percussion for our gala.",
    createdAt: "2026-07-02T08:00:00.000Z",
    messageType: "text"
  },
  {
    id: "chat-1",
    bookingId: "booking-2",
    senderUserId: "client-2",
    senderRole: "client",
    body: "Could we adjust the start time to 17:00 and include a second saxophonist?",
    createdAt: "2026-07-01T10:15:00.000Z",
    messageType: "text"
  },
  {
    id: "chat-2",
    bookingId: "booking-2",
    senderUserId: "user-artist-2",
    senderRole: "artist",
    body: "Counter-offer issued: R34,500 with 17:00 start and extended 2h set.",
    createdAt: "2026-07-01T10:22:00.000Z",
    systemAction: "counter_offer",
    messageType: "counter_offer",
    counterOfferId: "counter-1"
  }
];

export const MOCK_COUNTER_OFFERS: CounterOffer[] = [
  {
    id: "counter-1",
    bookingId: "booking-2",
    proposedPriceZar: 34500,
    proposedStartTime: "17:00",
    proposedEndTime: "19:00",
    note: "Includes second saxophonist",
    issuedByUserId: "user-artist-2",
    issuedByRole: "artist",
    status: "pending",
    createdAt: "2026-07-01T10:22:00.000Z"
  }
];

export const MOCK_CONTRACTS: ContractRecord[] = [
  {
    id: "contract-1",
    bookingId: "booking-2",
    status: "pending_signatures",
    bodyMarkdown:
      "# Performance Agreement\n\n**Client:** Velvet Wedding Reception\n**Artist:** The Velvet Horns\n**Venue:** The Manor House, Pretoria\n**Date:** 2026-09-02\n**Fee:** R32,000 ZAR\n\n## Cancellation\nTiered refund policy applies per StageBook escrow terms.\n\n## Technical Rider\nSoundcheck 2h prior. Stage plot attached.",
    pdfUrl: undefined
  }
];

export const AVAILABILITY_LABEL: Record<AvailabilityStatus, string> = {
  available: "Available",
  limited: "Limited",
  fully_booked: "Booked"
};

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  request_sent: "Request Sent",
  agreement: "Negotiating",
  paid: "Deposit Paid",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed"
};

export const ROLE_LABEL: Record<UserRole, string> = {
  client: "Client",
  artist: "Artist",
  representative: "Representative",
  admin: "Admin"
};