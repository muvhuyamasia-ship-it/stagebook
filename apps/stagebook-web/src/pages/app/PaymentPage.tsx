import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BALANCE_RATE,
  DEPOSIT_RATE,
  PLATFORM_COMMISSION_RATE,
  formatZar,
  type PayfastCheckoutSession
} from "@stagebook/shared";
import { useStageBook } from "../../context/StageBookContext";
import { LuxuryCard } from "../../components/ui/LuxuryCard";
import { Button } from "../../components/ui/Button";
import { PayfastSandboxModal } from "../../components/payments/PayfastSandboxModal";

export function PaymentPage() {
  const { bookingId = "" } = useParams();
  const { getBooking, getPaymentSchedule, createPayfastCheckout, completePayfastPayment } =
    useStageBook();
  const booking = getBooking(bookingId);
  const schedule = getPaymentSchedule(bookingId);
  const [checkout, setCheckout] = useState<PayfastCheckoutSession | null>(null);
  const [loading, setLoading] = useState(false);

  if (!booking || !schedule) return <p>Booking not found.</p>;

  async function openCheckout(phase: "deposit" | "balance") {
    setLoading(true);
    const session = await createPayfastCheckout(bookingId, phase);
    setLoading(false);
    if (session) setCheckout(session);
  }

  async function confirmSandbox() {
    if (!checkout) return;
    setLoading(true);
    await completePayfastPayment(bookingId, checkout.phase);
    setLoading(false);
    setCheckout(null);
  }

  const depositPaid = booking.status === "paid" || booking.status === "confirmed";
  const fullyConfirmed = booking.status === "confirmed";

  return (
    <div className="page-stack">
      <LuxuryCard>
        <Link to={`/app/bookings/${bookingId}`}>← Booking detail</Link>
        <h1 className="page-title">PayFast escrow checkout</h1>
        <p className="page-copy">
          Sandbox gateway for 30% deposit and 70% balance. Successful deposit locks the calendar slot globally.
        </p>
      </LuxuryCard>

      <LuxuryCard>
        <h2>Payment breakdown</h2>
        <ul className="bullet-list">
          <li>Total offer: {formatZar(schedule.totalAmountZar)}</li>
          <li>
            {Math.round(DEPOSIT_RATE * 100)}% deposit (locks calendar): {formatZar(schedule.depositAmountZar)}
          </li>
          <li>
            {Math.round(BALANCE_RATE * 100)}% balance (due 48h pre-event):{" "}
            {formatZar(schedule.balanceAmountZar)}
          </li>
          <li>
            {Math.round(PLATFORM_COMMISSION_RATE * 100)}% platform fee: {formatZar(schedule.platformFeeZar)}
          </li>
          <li>Artist net: {formatZar(schedule.artistNetZar)}</li>
        </ul>
        <p className="text-muted">Balance due: {new Date(schedule.balanceDueAt).toLocaleString()}</p>
        <div className="cta-row">
          <Button
            variant="primary"
            onClick={() => openCheckout("deposit")}
            disabled={depositPaid || loading}
          >
            Pay 30% deposit via PayFast
          </Button>
          <Button
            variant="secondary"
            onClick={() => openCheckout("balance")}
            disabled={!depositPaid || fullyConfirmed || loading}
          >
            Pay 70% balance via PayFast
          </Button>
        </div>
        {depositPaid ? (
          <p className="text-success">
            Calendar slot locked globally — overlapping bookings blocked for this artist and date.
          </p>
        ) : null}
        {fullyConfirmed ? (
          <p className="text-success">Booking fully confirmed. Escrow balance captured.</p>
        ) : null}
      </LuxuryCard>

      {checkout ? (
        <PayfastSandboxModal
          session={checkout}
          onConfirm={confirmSandbox}
          onClose={() => setCheckout(null)}
          loading={loading}
        />
      ) : null}
    </div>
  );
}