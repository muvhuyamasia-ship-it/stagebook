import { Link } from "react-router-dom";
import { BOOKING_STATUS_LABEL, formatZar } from "@stagebook/shared";
import { CalendarMonth } from "../../components/bookings/CalendarMonth";
import { useStageBook } from "../../context/StageBookContext";
import { useAuth } from "../../context/AuthContext";
import { LuxuryCard } from "../../components/ui/LuxuryCard";
import { Button } from "../../components/ui/Button";

export function BookingsPage() {
  const { bookings, getArtist, getCalendarState, myArtistProfile } = useStageBook();
  const { session } = useAuth();
  const role = session?.user.role ?? "client";
  const calendarArtistId =
    myArtistProfile?.id ??
    (role === "representative" ? bookings.find((b) => b.status !== "cancelled")?.artistProfileId : undefined);

  const inbox =
    role === "artist" || role === "representative"
      ? bookings.filter((b) => b.status === "request_sent")
      : [];

  const schedule = bookings.filter((b) => !["declined", "cancelled"].includes(b.status));

  return (
    <div className="page-stack">
      <LuxuryCard>
        <div className="section-head">
          <div>
            <h1 className="page-title">Bookings & calendar</h1>
            <p className="page-copy">Master schedule, offer statuses, timeline views, and request inbox.</p>
          </div>
          {role === "client" ? (
            <Button as="link" to="/app/bookings/new" variant="primary">
              New booking
            </Button>
          ) : null}
        </div>
      </LuxuryCard>

      {(role === "artist" || role === "representative") && inbox.length > 0 ? (
        <LuxuryCard>
          <h2>Booking request inbox</h2>
          <p className="page-copy">Incoming requests with client credentials, offer value, and travel warnings.</p>
          {inbox.map((booking) => {
            const artist = getArtist(booking.artistProfileId);
            return (
              <div key={booking.id} className="inbox-card">
                <div>
                  <h3>{booking.eventName}</h3>
                  <p className="text-muted">{artist?.stageName} · Client #{booking.clientUserId}</p>
                  <p className="metric-text">{formatZar(booking.quotedPriceZar)}</p>
                  <ul className="bullet-list">
                    <li>{booking.eventDate} · {booking.startTime}–{booking.endTime}</li>
                    <li>{booking.locationLabel}</li>
                    <li>{booking.guestCount} guests · {booking.eventType}</li>
                  </ul>
                  {booking.travelWarning ? <p className="alert-text">{booking.travelWarning}</p> : null}
                </div>
                <div className="cta-row">
                  <Button as="link" to={`/app/bookings/${booking.id}`} variant="primary">Review</Button>
                  <Button as="link" to={`/app/messages/${booking.id}`} variant="secondary">Negotiate</Button>
                </div>
              </div>
            );
          })}
        </LuxuryCard>
      ) : null}

      <div className="calendar-legend">
        <span className="legend-dot legend-dot--available" /> Available
        <span className="legend-dot legend-dot--partial" /> Partially booked
        <span className="legend-dot legend-dot--booked" /> Fully booked
        <span className="legend-dot legend-dot--past" /> Past dates
      </div>

      {calendarArtistId ? (
        <CalendarMonth
          artistId={calendarArtistId}
          bookings={bookings}
          getCalendarState={getCalendarState}
        />
      ) : null}

      {schedule.map((booking) => {
        const artist = getArtist(booking.artistProfileId);
        return (
          <LuxuryCard key={booking.id}>
            <div className="booking-row">
              <div>
                <h3>{booking.eventName}</h3>
                <p className="text-muted">
                  {artist?.stageName} · {booking.eventDate} · {booking.startTime}–{booking.endTime}
                </p>
                <p className="metric-text">{formatZar(booking.quotedPriceZar)}</p>
                {booking.travelWarning ? <p className="alert-text">{booking.travelWarning}</p> : null}
              </div>
              <div className="booking-row__actions">
                <span className={`status-tag status-tag--${booking.status}`}>
                  {BOOKING_STATUS_LABEL[booking.status]}
                </span>
                <Link to={`/app/bookings/${booking.id}`}>Open →</Link>
                <Link to={`/app/messages/${booking.id}`}>Message →</Link>
              </div>
            </div>
          </LuxuryCard>
        );
      })}
    </div>
  );
}