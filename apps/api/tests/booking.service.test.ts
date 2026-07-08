import { beforeEach, describe, expect, it } from "vitest";
import { bookingService } from "../src/modules/bookings/booking.service";
import { store } from "../src/lib/inMemoryStore";

describe("BookingService", () => {
  beforeEach(() => {
    store.bookings = [];
  });

  it("prevents overlapping bookings", () => {
    bookingService.create({
      artistProfileId: "artist-1",
      clientUserId: "client-1",
      eventName: "Brand launch",
      eventType: "Corporate",
      eventDate: "2026-05-20",
      startTime: "10:00",
      endTime: "14:00",
      locationLabel: "Sandton",
      latitude: -26.1076,
      longitude: 28.0567,
      guestCount: 200,
      quotedPriceZar: 10000
    });

    expect(() =>
      bookingService.create({
        artistProfileId: "artist-1",
        clientUserId: "client-2",
        eventName: "Second event",
        eventType: "Private",
        eventDate: "2026-05-20",
        startTime: "12:00",
        endTime: "16:00",
        locationLabel: "Rosebank",
        latitude: -26.1450,
        longitude: 28.0413,
        guestCount: 120,
        quotedPriceZar: 8000
      })
    ).toThrowError(/conflicting booking/i);
  });

  it("returns the StageBook cancellation refund percentages", () => {
    expect(bookingService.getRefundPercentage(20)).toBe(1);
    expect(bookingService.getRefundPercentage(10)).toBe(0.75);
    expect(bookingService.getRefundPercentage(3)).toBe(0.5);
  });

  it("warns when travel time between nearby bookings is tight", () => {
    bookingService.create({
      artistProfileId: "artist-1",
      clientUserId: "client-1",
      eventName: "Afternoon set",
      eventType: "Festival",
      eventDate: "2026-05-20",
      startTime: "08:00",
      endTime: "10:00",
      locationLabel: "Pretoria",
      latitude: -25.7479,
      longitude: 28.2293,
      guestCount: 500,
      quotedPriceZar: 12000
    });

    const result = bookingService.create({
      artistProfileId: "artist-1",
      clientUserId: "client-2",
      eventName: "Evening set",
      eventType: "Private",
      eventDate: "2026-05-20",
      startTime: "12:00",
      endTime: "14:00",
      locationLabel: "Johannesburg",
      latitude: -26.2041,
      longitude: 28.0473,
      guestCount: 120,
      quotedPriceZar: 9000
    });

    expect(result.booking.travelWarning).toMatch(/Travel time may be insufficient/i);
  });

  it("calculates refunds and requires a cancellation reason", () => {
    const booking = bookingService.create({
      artistProfileId: "artist-1",
      clientUserId: "client-1",
      eventName: "Luxury brunch",
      eventType: "Private",
      eventDate: "2026-05-30",
      startTime: "12:00",
      endTime: "14:00",
      locationLabel: "Johannesburg",
      latitude: -26.2041,
      longitude: 28.0473,
      guestCount: 120,
      quotedPriceZar: 10000
    }).booking;

    expect(() => bookingService.cancel(booking.id, "")).toThrowError(/reason is required/i);

    const cancelled = bookingService.cancel(booking.id, "Client postponed the event", new Date("2026-05-15T00:00:00.000Z"));
    expect(cancelled.refundPercentage).toBe(1);
    expect(cancelled.refundAmountZar).toBe(10000);
  });
});
