import { Link, useParams } from "react-router-dom";
import { DEPOSIT_RATE, BALANCE_RATE, PLATFORM_COMMISSION_RATE, formatZar } from "@stagebook/shared";
import { useStageBook } from "../../context/StageBookContext";
import { LuxuryCard } from "../../components/ui/LuxuryCard";
import { Button } from "../../components/ui/Button";

export function PaymentPage() {
  const { bookingId = "" } = useParams();
  const { getBooking, getPaymentSchedule, payDeposit, confirmBalance } = useStageBook();
  const booking = getBooking(bookingId);
  const schedule = getPaymentSchedule(bookingId);

  if (!booking || !schedule) return <p>Booking not found.</p>;

  return (
    <div className="page-stack">
      <LuxuryCard>
        <Link to={`/app/bookings/${bookingId}`}>← Booking detail</Link>
        <h1 className="page-title">Escrow checkout</h1>
        <p className="page-copy">Platform escrow with deposit lock and automated balance collection.</p>
      </LuxuryCard>

      <LuxuryCard>
        <h2>Payment breakdown</h2>
        <ul className="bullet-list">
          <li>Total offer: {formatZar(schedule.totalAmountZar)}</li>
          <li>{Math.round(DEPOSIT_RATE * 100)}% deposit (locks calendar): {formatZar(schedule.depositAmountZar)}</li>
          <li>{Math.round(BALANCE_RATE * 100)}% balance (due 48h pre-event): {formatZar(schedule.balanceAmountZar)}</li>
          <li>{Math.round(PLATFORM_COMMISSION_RATE * 100)}% platform fee: {formatZar(schedule.platformFeeZar)}</li>
          <li>Artist net: {formatZar(schedule.artistNetZar)}</li>
        </ul>
        <p className="text-muted">Balance due: {new Date(schedule.balanceDueAt).toLocaleString()}</p>
        <div className="cta-row">
          <Button variant="primary" onClick={() => payDeposit(bookingId)} disabled={booking.status === "paid" || booking.status === "confirmed"}>
            Confirm 30% deposit
          </Button>
          <Button variant="secondary" onClick={() => confirmBalance(bookingId)} disabled={booking.status !== "paid"}>
            Collect remaining 70%
          </Button>
        </div>
        {booking.status === "paid" || booking.status === "confirmed" ? (
          <p className="text-success">Calendar slot locked globally — overlapping bookings blocked.</p>
        ) : null}
      </LuxuryCard>
    </div>
  );
}