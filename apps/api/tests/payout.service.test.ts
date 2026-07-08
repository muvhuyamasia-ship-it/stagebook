import { beforeEach, describe, expect, it } from "vitest";
import { store } from "../src/lib/inMemoryStore";
import { payoutService } from "../src/modules/payouts/payout.service";

describe("PayoutService", () => {
  beforeEach(() => {
    store.artists = [
      {
        id: "artist-profile-1",
        userId: "artist-user-1",
        stageName: "Luna Vibe",
        bio: "",
        genres: ["DJ"],
        basePriceZar: 1,
        city: "Johannesburg",
        province: "Gauteng",
        latitude: 0,
        longitude: 0,
        rating: 0,
        reviewCount: 0,
        media: [],
        availabilityStatus: "available",
        bankAccountLinked: true
      }
    ];
    store.bookings = [
      {
        id: "booking-1",
        artistProfileId: "artist-profile-1",
        clientUserId: "client-1",
        eventName: "Luxury Gala",
        eventType: "Corporate",
        eventDate: "2026-05-20",
        startTime: "18:00",
        endTime: "20:00",
        locationLabel: "Cape Town",
        latitude: 0,
        longitude: 0,
        guestCount: 100,
        quotedPriceZar: 22000,
        status: "completed"
      }
    ];
    store.verifications = [];
    store.payouts = [];
  });

  it("blocks payout requests before identity verification", () => {
    expect(() =>
      payoutService.requestPayout({
        requesterUserId: "artist-user-1",
        artistProfileId: "artist-profile-1",
        amountZar: 5000
      })
    ).toThrowError(/Identity verification is required/i);
  });

  it("allows the artist to request a payout after verification", () => {
    store.verifications.push({
      artistProfileId: "artist-profile-1",
      southAfricanIdNumber: "9001015009087",
      idDocumentUrl: "https://example.com/id.jpg",
      faceScanUrl: "https://example.com/face.jpg",
      status: "verified"
    });

    const payout = payoutService.requestPayout({
      requesterUserId: "artist-user-1",
      artistProfileId: "artist-profile-1",
      amountZar: 5000
    });

    expect(payout.status).toBe("pending");
    expect(store.payouts).toHaveLength(1);
  });
});
