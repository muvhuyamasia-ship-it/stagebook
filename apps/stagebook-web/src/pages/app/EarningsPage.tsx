import { useEffect, useState } from "react";
import { formatZar } from "@stagebook/shared";
import { useStageBook } from "../../context/StageBookContext";
import { LuxuryCard } from "../../components/ui/LuxuryCard";
import { Button } from "../../components/ui/Button";
import { Field, TextInput } from "../../components/ui/Field";

export function EarningsPage() {
  const {
    bookings,
    myArtistProfile,
    payoutBalances,
    payouts,
    loadArtistDashboard,
    requestPayout
  } = useStageBook();
  const [amount, setAmount] = useState("");

  useEffect(() => {
    void loadArtistDashboard();
  }, [loadArtistDashboard]);

  const confirmed = bookings.filter((b) =>
    ["confirmed", "completed", "paid"].includes(b.status)
  );
  const gross = confirmed.reduce((sum, b) => sum + b.quotedPriceZar, 0);
  const fees = Math.round(gross * 0.05);
  const available = payoutBalances?.availableBalanceZar ?? 0;
  const pending = payoutBalances?.pendingBalanceZar ?? 0;

  return (
    <div className="page-stack">
      <LuxuryCard>
        <h1 className="page-title">Earnings & payouts</h1>
        <p className="page-copy">Live balances from the StageBook API for artists and representatives.</p>
        <div className="stats-grid">
          <div className="stat-block">
            <p className="label-sm">Gross from bookings</p>
            <p className="stat-value">{formatZar(gross)}</p>
          </div>
          <div className="stat-block">
            <p className="label-sm">Available balance</p>
            <p className="stat-value">{formatZar(available)}</p>
          </div>
          <div className="stat-block">
            <p className="label-sm">Pending escrow</p>
            <p className="stat-value">{formatZar(pending)}</p>
          </div>
          <div className="stat-block">
            <p className="label-sm">Platform fees (5%)</p>
            <p className="stat-value">{formatZar(fees)}</p>
          </div>
        </div>
      </LuxuryCard>

      <LuxuryCard>
        <h2>Request payout</h2>
        <p className="text-muted">
          {myArtistProfile
            ? `Artist: ${myArtistProfile.stageName}`
            : "Sign in as an artist to request payouts."}
        </p>
        <Field label="Amount (ZAR)">
          <TextInput
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={String(available || 0)}
          />
        </Field>
        <Button
          variant="primary"
          disabled={!myArtistProfile || !amount}
          onClick={() => requestPayout(Number(amount))}
        >
          Request payout
        </Button>
      </LuxuryCard>

      <LuxuryCard>
        <h2>Payout history</h2>
        {payouts.length === 0 ? (
          <p className="text-muted">No payout requests yet.</p>
        ) : (
          payouts.map((payout) => (
            <div key={payout.id} className="booking-row">
              <div>
                <p className="value-lg">{formatZar(payout.amountZar)}</p>
                <p className="text-muted">{payout.status}</p>
              </div>
            </div>
          ))
        )}
      </LuxuryCard>

      <LuxuryCard>
        <h2>Upcoming engagements</h2>
        {bookings.slice(0, 6).map((booking) => (
          <div key={booking.id} className="booking-row">
            <div>
              <p className="value-lg">{booking.eventName}</p>
              <p className="text-muted">{booking.eventDate}</p>
            </div>
            <span className={`status-tag status-tag--${booking.status}`}>{booking.status}</span>
          </div>
        ))}
      </LuxuryCard>
    </div>
  );
}