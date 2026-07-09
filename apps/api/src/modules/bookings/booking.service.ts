import { v4 as uuid } from "uuid";
import {
  BALANCE_RATE,
  DEPOSIT_RATE,
  PLATFORM_COMMISSION_RATE,
  STAGEBOOK_TIME_SLOTS,
  type BookingRequest,
  type BookingStatus,
  type PaymentSchedule
} from "@stagebook/shared";
import { AppError } from "../../lib/errors";
import { store } from "../../lib/inMemoryStore";

const SLOT_DURATION_HOURS = 2;
const MINUTES_PER_KM = 2;

function toMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function haversineKm(start: { lat: number; lng: number }, end: { lat: number; lng: number }) {
  const radius = 6371;
  const dLat = ((end.lat - start.lat) * Math.PI) / 180;
  const dLng = ((end.lng - start.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos((start.lat * Math.PI) / 180)
      * Math.cos((end.lat * Math.PI) / 180)
      * Math.sin(dLng / 2) ** 2;
  return radius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export class BookingService {
  validateTimeslot(startTime: string, endTime: string) {
    if (!STAGEBOOK_TIME_SLOTS.includes(startTime as (typeof STAGEBOOK_TIME_SLOTS)[number])) {
      throw new AppError("Invalid start time slot", 400);
    }

    const duration = toMinutes(endTime) - toMinutes(startTime);
    if (duration < SLOT_DURATION_HOURS * 60 || duration % 60 !== 0) {
      throw new AppError("Bookings must use valid StageBook slot durations", 400);
    }
  }

  buildPaymentSchedule(totalAmountZar: number, eventDate: string): PaymentSchedule {
    const depositAmountZar = Math.round(totalAmountZar * DEPOSIT_RATE);
    const balanceAmountZar = Math.round(totalAmountZar * BALANCE_RATE);
    const platformFeeZar = Math.round(totalAmountZar * PLATFORM_COMMISSION_RATE);
    const artistNetZar = totalAmountZar - platformFeeZar;
    const dueDate = new Date(`${eventDate}T00:00:00.000Z`);
    dueDate.setUTCHours(dueDate.getUTCHours() - 48);

    return {
      totalAmountZar,
      depositAmountZar,
      balanceAmountZar,
      platformFeeZar,
      artistNetZar,
      balanceDueAt: dueDate.toISOString()
    };
  }

  getRefundPercentage(daysUntilEvent: number) {
    if (daysUntilEvent >= 14) {
      return 1;
    }
    if (daysUntilEvent >= 7) {
      return 0.75;
    }
    return 0.5;
  }

  create(input: Omit<BookingRequest, "id" | "status" | "travelWarning">) {
    this.validateTimeslot(input.startTime, input.endTime);

    const existingSameDay = store.bookings.filter(
      (booking) => booking.artistProfileId === input.artistProfileId && booking.eventDate === input.eventDate
    );

    const startMinutes = toMinutes(input.startTime);
    const endMinutes = toMinutes(input.endTime);
    const conflicting = existingSameDay.find((booking) => {
      const otherStart = toMinutes(booking.startTime);
      const otherEnd = toMinutes(booking.endTime);
      return startMinutes < otherEnd && endMinutes > otherStart;
    });

    if (conflicting) {
      throw new AppError("This artist already has a conflicting booking", 409);
    }

    let travelWarning: string | undefined;
    const nearestAdjacent = existingSameDay.find((booking) => {
      const otherStart = toMinutes(booking.startTime);
      const otherEnd = toMinutes(booking.endTime);
      return Math.abs(startMinutes - otherEnd) <= 180 || Math.abs(otherStart - endMinutes) <= 180;
    });

    if (nearestAdjacent) {
      const distanceKm = haversineKm(
        { lat: input.latitude, lng: input.longitude },
        { lat: nearestAdjacent.latitude, lng: nearestAdjacent.longitude }
      );
      const requiredTravelMinutes = Math.ceil(distanceKm * MINUTES_PER_KM);
      const gapAfterExisting = startMinutes - toMinutes(nearestAdjacent.endTime);
      const gapBeforeExisting = toMinutes(nearestAdjacent.startTime) - endMinutes;
      const gapMinutes = Math.min(
        gapAfterExisting >= 0 ? gapAfterExisting : Number.POSITIVE_INFINITY,
        gapBeforeExisting >= 0 ? gapBeforeExisting : Number.POSITIVE_INFINITY
      );

      if (gapMinutes < requiredTravelMinutes) {
        travelWarning = `Travel time may be insufficient: need about ${requiredTravelMinutes} minutes between bookings.`;
      }
    }

    const booking: BookingRequest = {
      ...input,
      id: uuid(),
      status: "request_sent",
      travelWarning
    };

    store.bookings.push(booking);
    return {
      booking,
      paymentSchedule: this.buildPaymentSchedule(input.quotedPriceZar, input.eventDate)
    };
  }

  getById(id: string) {
    const booking = store.bookings.find((entry) => entry.id === id);
    if (!booking) {
      throw new AppError("Booking not found", 404);
    }
    return booking;
  }

  transitionStatus(
    id: string,
    status: BookingStatus,
    updates?: { quotedPriceZar?: number; startTime?: string; endTime?: string }
  ) {
    const booking = this.getById(id);

    if (status === "agreement" && updates) {
      if (updates.quotedPriceZar) {
        booking.quotedPriceZar = updates.quotedPriceZar;
      }

      const { startTime, endTime } = updates;
      if (startTime || endTime) {
        if (!startTime || !endTime) {
          throw new AppError("Both start and end times are required", 400);
        }
        this.validateTimeslot(startTime, endTime);
        booking.startTime = startTime;
        booking.endTime = endTime;
      }
    }

    booking.status = status;
    return {
      booking,
      paymentSchedule: this.buildPaymentSchedule(booking.quotedPriceZar, booking.eventDate)
    };
  }

  cancel(id: string, reason: string, now = new Date()) {
    if (!reason?.trim()) {
      throw new AppError("Cancellation reason is required", 400);
    }

    const booking = this.getById(id);
    booking.status = "cancelled";

    const eventStart = new Date(`${booking.eventDate}T00:00:00.000Z`);
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysUntilEvent = Math.ceil((eventStart.getTime() - now.getTime()) / msPerDay);
    const refundPercentage = this.getRefundPercentage(daysUntilEvent);

    return {
      booking,
      cancellationReason: reason,
      refundPercentage,
      refundAmountZar: Math.round(booking.quotedPriceZar * refundPercentage)
    };
  }

  listForUser(userId: string) {
    return store.bookings.filter(
      (booking) =>
        booking.clientUserId === userId || booking.representativeUserId === userId || this.artistOwnsBooking(booking.artistProfileId, userId)
    );
  }

  canUserAccess(userId: string, role: string, bookingId: string) {
    const booking = this.getById(bookingId);
    if (booking.clientUserId === userId) {
      return true;
    }
    if (this.artistOwnsBooking(booking.artistProfileId, userId)) {
      return true;
    }
    if (role === "representative") {
      return store.representativeLinks.some(
        (link) => link.representativeUserId === userId && link.artistProfileId === booking.artistProfileId
      );
    }
    return false;
  }

  canManageBooking(userId: string, role: string, bookingId: string) {
    if (role === "artist") {
      return this.artistOwnsBooking(this.getById(bookingId).artistProfileId, userId);
    }
    if (role === "representative") {
      const booking = this.getById(bookingId);
      return store.representativeLinks.some(
        (link) => link.representativeUserId === userId && link.artistProfileId === booking.artistProfileId
      );
    }
    return false;
  }

  private artistOwnsBooking(artistProfileId: string, userId: string) {
    return store.artists.some((artist) => artist.id === artistProfileId && artist.userId === userId);
  }
}

export const bookingService = new BookingService();
