import { formatZar } from "@stagebook/shared";
import { useStageBook } from "../../context/StageBookContext";
import { LuxuryCard } from "../../components/ui/LuxuryCard";
import { Button } from "../../components/ui/Button";

const revenueTrend = [
  { month: "Jan", value: 42000 },
  { month: "Feb", value: 38000 },
  { month: "Mar", value: 51000 },
  { month: "Apr", value: 47000 },
  { month: "May", value: 62000 },
  { month: "Jun", value: 58000 }
];

export function EarningsPage() {
  const { bookings } = useStageBook();
  const completed = bookings.filter((b) => ["confirmed", "completed", "paid"].includes(b.status));
  const gross = completed.reduce((sum, b) => sum + b.quotedPriceZar, 0);
  const fees = Math.round(gross * 0.05);
  const max = Math.max(...revenueTrend.map((r) => r.value));

  return (
    <div className="page-stack">
      <LuxuryCard>
        <h1 className="page-title">Earnings & payouts</h1>
        <p className="page-copy">Financial tracking for artists and representatives.</p>
        <div className="stats-grid">
          <div className="stat-block">
            <p className="label-sm">Total gross earnings</p>
            <p className="stat-value">{formatZar(gross || 248000)}</p>
          </div>
          <div className="stat-block">
            <p className="label-sm">Bookings completed</p>
            <p className="stat-value">{completed.length || 34}</p>
          </div>
          <div className="stat-block">
            <p className="label-sm">Platform fees deducted</p>
            <p className="stat-value">{formatZar(fees || 12400)}</p>
          </div>
          <div className="stat-block">
            <p className="label-sm">Pending payouts</p>
            <p className="stat-value">{formatZar(41200)}</p>
          </div>
        </div>
      </LuxuryCard>

      <LuxuryCard>
        <h2>Monthly revenue trend</h2>
        <div className="trend-chart">
          {revenueTrend.map((point) => (
            <div key={point.month} className="trend-chart__col">
              <div className="trend-chart__bar" style={{ height: `${(point.value / max) * 100}%` }} />
              <span>{point.month}</span>
            </div>
          ))}
        </div>
      </LuxuryCard>

      <LuxuryCard>
        <h2>Upcoming engagements</h2>
        {bookings.slice(0, 4).map((booking) => (
          <div key={booking.id} className="booking-row">
            <div>
              <p className="value-lg">{booking.eventName}</p>
              <p className="text-muted">{booking.eventDate}</p>
            </div>
            <span className={`status-tag status-tag--${booking.status}`}>{booking.status}</span>
          </div>
        ))}
        <Button variant="secondary">Request payout</Button>
      </LuxuryCard>
    </div>
  );
}