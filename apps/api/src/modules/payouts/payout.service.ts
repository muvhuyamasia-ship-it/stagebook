import { v4 as uuid } from "uuid";
import { AppError } from "../../lib/errors";
import { store } from "../../lib/inMemoryStore";

export class PayoutService {
  getBalances(artistProfileId: string) {
    const completedRevenue = store.bookings
      .filter((booking) => booking.artistProfileId === artistProfileId && booking.status === "completed")
      .reduce((sum, booking) => sum + booking.quotedPriceZar, 0);
    const pendingRevenue = store.bookings
      .filter((booking) => booking.artistProfileId === artistProfileId && ["paid", "confirmed"].includes(booking.status))
      .reduce((sum, booking) => sum + booking.quotedPriceZar, 0);

    return {
      availableBalanceZar: completedRevenue,
      pendingBalanceZar: pendingRevenue
    };
  }

  requestPayout(input: { requesterUserId: string; artistProfileId: string; amountZar: number }) {
    const artist = store.artists.find((entry) => entry.id === input.artistProfileId);
    if (!artist || artist.userId !== input.requesterUserId) {
      throw new AppError("Only the artist can request payouts", 403);
    }

    const verification = store.verifications.find((entry) => entry.artistProfileId === input.artistProfileId);
    if (!verification || verification.status !== "verified") {
      throw new AppError("Identity verification is required before payout", 403);
    }

    const balances = this.getBalances(input.artistProfileId);
    if (input.amountZar > balances.availableBalanceZar) {
      throw new AppError("Requested payout exceeds available balance", 400);
    }

    const payout = {
      id: uuid(),
      artistProfileId: input.artistProfileId,
      amountZar: input.amountZar,
      status: "pending" as const
    };
    store.payouts.push(payout);
    return payout;
  }

  listForArtist(artistProfileId: string) {
    return store.payouts.filter((entry) => entry.artistProfileId === artistProfileId);
  }
}

export const payoutService = new PayoutService();
