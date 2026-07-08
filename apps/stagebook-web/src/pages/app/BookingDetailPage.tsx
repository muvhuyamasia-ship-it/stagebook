import { Link, useParams } from "react-router-dom";
import { BOOKING_STATUS_LABEL, formatZar } from "@stagebook/shared";
import { useStageBook } from "../../context/StageBookContext";
import { useAuth } from "../../context/AuthContext";
import { LuxuryCard } from "../../components/ui/LuxuryCard";
import { Button } from "../../components/ui/Button";

export function BookingDetailPage() {
  const { bookingId = "" } = useParams();
  const { getBooking, getArtist, acceptOffer, declineOffer, cancelBooking } = useStageBook();
  const { session } = useAuth();
  const booking = getBooking(bookingId);
  const artist = booking ? getArtist(booking.artistProfileId) : undefined;
  const role = session?.user.role;

  if (!booking) return <p>Booking not found.</p>;

  return (
    <div className="page-stack">
      <LuxuryCard>
        <Link to="/app/bookings">← Back to bookings</Link>
        <h1 className="page-title">{booking.eventName}</h1>
        <p className="text-muted">{artist?.stageName} · {booking.eventDate}</p>
        <span className={`status-tag status-tag--${booking.status}`}>{BOOKING_STATUS_LABEL[booking.status]}</span>
        <p className="metric-text">{formatZar(booking.quotedPriceZar)}</p>
        {booking.travelWarning ? <p className="alert-text">{booking.travelWarning}</p> : null}
      </LuxuryCard>

      {(role === "artist" || role === "representative") && booking.status === "request_sent" ? (
        <LuxuryCard>
          <h2>Decision matrix</h2>
          <div className="cta-row">
            <Button variant="primary" onClick={() => acceptOffer(booking.id)}>Accept Offer</Button>
            <Button variant="outline" onClick={() => declineOffer(booking.id)}>Decline Request</Button>
            <Button as="link" to={`/app/bookings/${booking.id}/chat`} variant="secondary">Counter Offer</Button>
          </div>
        </LuxuryCard>
      ) : null}

      <LuxuryCard>
        <h2>Event parameters</h2>
        <ul className="bullet-list">
          <li>Venue: {booking.locationLabel}</li>
          <li>Time: {booking.startTime} – {booking.endTime}</li>
          <li>Guests: {booking.guestCount}</li>
          <li>Type: {booking.eventType}</li>
        </ul>
        <div className="cta-row">
          <Button as="link" to={`/app/bookings/${booking.id}/chat`} variant="secondary">Messages</Button>
          <Button as="link" to={`/app/bookings/${booking.id}/contract`} variant="outline">Contract</Button>
          <Button as="link" to={`/app/bookings/${booking.id}/payment`} variant="primary">Payment</Button>
          <Button variant="ghost" onClick={() => cancelBooking(booking.id)}>Cancel booking</Button>
        </div>
      </LuxuryCard>
    </div>
  );
}