import type { BookingRequest, BookingStatus, ChatMessage, UserRole } from "./index";

const STATUS_LABEL: Record<BookingStatus, string> = {
  request_sent: "Request Sent",
  agreement: "Negotiating",
  paid: "Deposit Paid",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed"
};

export type CounterOfferStatus = "pending" | "accepted" | "declined";

export interface CounterOffer {
  id: string;
  bookingId: string;
  proposedPriceZar: number;
  proposedStartTime: string;
  proposedEndTime: string;
  note?: string;
  issuedByUserId: string;
  issuedByRole: UserRole;
  status: CounterOfferStatus;
  createdAt: string;
}

export type MessageThreadFilter = "all" | "negotiating" | "unread";

export interface MessageThreadSummary {
  bookingId: string;
  artistName: string;
  eventName: string;
  eventDate: string;
  status: BookingStatus;
  statusLabel: string;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  hasPendingCounter: boolean;
  isNegotiating: boolean;
}

export interface BookingContextItem {
  id: string;
  label: string;
  value: string;
}

const NEGOTIATING_STATUSES: BookingStatus[] = ["request_sent", "agreement"];

export function isNegotiatingStatus(status: BookingStatus) {
  return NEGOTIATING_STATUSES.includes(status);
}

export function buildBookingContext(booking: BookingRequest, artistName: string): BookingContextItem[] {
  return [
    { id: "artist", label: "Artist", value: artistName },
    { id: "event", label: "Event", value: booking.eventName },
    { id: "date", label: "Date", value: booking.eventDate },
    { id: "time", label: "Time", value: `${booking.startTime} – ${booking.endTime}` },
    { id: "venue", label: "Venue", value: booking.locationLabel },
    { id: "offer", label: "Current offer", value: `R${booking.quotedPriceZar.toLocaleString("en-ZA")}` },
    { id: "guests", label: "Guests", value: String(booking.guestCount) }
  ];
}

export function buildMessageThreads(input: {
  bookings: BookingRequest[];
  messages: ChatMessage[];
  counterOffers: CounterOffer[];
  readAtByBooking: Record<string, string>;
  artistNameById: Record<string, string>;
  filter?: MessageThreadFilter;
}): MessageThreadSummary[] {
  const { bookings, messages, counterOffers, readAtByBooking, artistNameById, filter = "all" } = input;

  const threads = bookings
    .filter((b) => !["declined", "cancelled"].includes(b.status))
    .map((booking) => {
      const threadMessages = messages
        .filter((m) => m.bookingId === booking.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const lastMessage = threadMessages.at(-1) ?? null;
      const readAt = readAtByBooking[booking.id];
      const unreadCount = threadMessages.filter((m) => !readAt || m.createdAt > readAt).length;
      const hasPendingCounter = counterOffers.some(
        (offer) => offer.bookingId === booking.id && offer.status === "pending"
      );

      return {
        bookingId: booking.id,
        artistName: artistNameById[booking.artistProfileId] ?? "Artist",
        eventName: booking.eventName,
        eventDate: booking.eventDate,
        status: booking.status,
        statusLabel: STATUS_LABEL[booking.status],
        lastMessage,
        unreadCount,
        hasPendingCounter,
        isNegotiating: isNegotiatingStatus(booking.status)
      };
    })
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ?? "";
      const bTime = b.lastMessage?.createdAt ?? "";
      return bTime.localeCompare(aTime);
    });

  if (filter === "negotiating") {
    return threads.filter((t) => t.isNegotiating);
  }
  if (filter === "unread") {
    return threads.filter((t) => t.unreadCount > 0);
  }
  return threads;
}

export function formatCounterOfferBody(offer: CounterOffer) {
  return `Counter-offer: R${offer.proposedPriceZar.toLocaleString("en-ZA")} · ${offer.proposedStartTime}–${offer.proposedEndTime}${
    offer.note ? ` · ${offer.note}` : ""
  }`;
}

const COUNTER_BODY_RE =
  /^Counter-offer: R([\d,]+) · (\d{2}:\d{2})–(\d{2}:\d{2})(?: · (.+))?$/;

export function deriveCounterOffersFromChat(messages: ChatMessage[]): CounterOffer[] {
  const sorted = [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const offers: CounterOffer[] = [];

  for (const message of sorted) {
    if (message.systemAction === "counter_offer" || message.messageType === "counter_offer") {
      const match = message.body.match(COUNTER_BODY_RE);
      if (!match) continue;

      offers.push({
        id: message.counterOfferId ?? message.id,
        bookingId: message.bookingId,
        proposedPriceZar: Number.parseInt(match[1].replace(/,/g, ""), 10),
        proposedStartTime: match[2],
        proposedEndTime: match[3],
        note: match[4],
        issuedByUserId: message.senderUserId,
        issuedByRole: message.senderRole,
        status: "pending",
        createdAt: message.createdAt
      });
      continue;
    }

    if (message.systemAction === "accept" || message.systemAction === "decline") {
      for (let index = offers.length - 1; index >= 0; index -= 1) {
        const offer = offers[index];
        if (offer.bookingId === message.bookingId && offer.status === "pending") {
          offers[index] = {
            ...offer,
            status: message.systemAction === "accept" ? "accepted" : "declined"
          };
          break;
        }
      }
    }
  }

  const latestPendingByBooking = new Set<string>();
  for (let index = offers.length - 1; index >= 0; index -= 1) {
    const offer = offers[index];
    if (offer.status !== "pending") continue;
    if (latestPendingByBooking.has(offer.bookingId)) {
      offers[index] = { ...offer, status: "declined" };
    } else {
      latestPendingByBooking.add(offer.bookingId);
    }
  }

  return offers;
}