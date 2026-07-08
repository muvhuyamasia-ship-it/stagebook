import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { STAGEBOOK_TIME_SLOTS } from "@stagebook/shared";
import { useStageBook } from "../../context/StageBookContext";
import { LuxuryCard } from "../../components/ui/LuxuryCard";
import { Button } from "../../components/ui/Button";
import { Field, TextArea, TextInput } from "../../components/ui/Field";

const durations = [1, 2, 3, 4] as const;

export function BookingWizardPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { getArtist, getCalendarState, createBooking } = useStageBook();
  const artistId = params.get("artist") ?? "artist-1";
  const artist = getArtist(artistId);

  const [step, setStep] = useState(1);
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [durationHours, setDurationHours] = useState(2);
  const [locationLabel, setLocationLabel] = useState("Sandton Convention Centre");
  const [quotedPrice, setQuotedPrice] = useState(artist?.basePriceZar ?? 18000);
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("Corporate");
  const [specialRequests, setSpecialRequests] = useState("");
  const [technicalRider, setTechnicalRider] = useState("");
  const [error, setError] = useState<string | null>(null);

  const endTime = useMemo(() => {
    const [h, m] = startTime.split(":").map(Number);
    const endH = h + durationHours;
    return `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }, [startTime, durationHours]);

  const calState = eventDate ? getCalendarState(artistId, eventDate) : "available";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const result = await createBooking({
      artistId,
      eventDate,
      startTime,
      endTime,
      durationHours,
      locationLabel,
      latitude: -26.107,
      longitude: 28.054,
      quotedPriceZar: quotedPrice,
      eventName,
      eventType,
      specialRequests,
      technicalRider,
      guestCount: 150
    });
    if (!result.ok) {
      setError(result.error ?? "Unable to create booking");
      return;
    }
    navigate(`/app/bookings/${result.bookingId}`);
  }

  if (!artist) return <p>Artist not found.</p>;

  return (
    <form className="page-stack" onSubmit={submit}>
      <LuxuryCard>
        <h1 className="page-title">Book {artist.stageName}</h1>
        <p className="page-copy">Step {step} of 4 — booking pipeline</p>
        <div className="wizard-steps">
          {["Date", "Time", "Location", "Offer"].map((label, i) => (
            <span key={label} className={`wizard-step${step === i + 1 ? " wizard-step--active" : ""}`}>
              {label}
            </span>
          ))}
        </div>
      </LuxuryCard>

      {step === 1 ? (
        <LuxuryCard>
          <h2>Date selection</h2>
          <div className="calendar-legend">
            <span className="legend-dot legend-dot--available" /> Available
            <span className="legend-dot legend-dot--partial" /> Partially booked
            <span className="legend-dot legend-dot--booked" /> Fully booked
            <span className="legend-dot legend-dot--past" /> Past
          </div>
          <Field label="Event date">
            <TextInput type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
          </Field>
          {eventDate ? (
            <p className={`cal-state cal-state--${calState}`}>Selected date: {calState.replace("_", " ")}</p>
          ) : null}
          <Button type="button" variant="primary" onClick={() => setStep(2)} disabled={!eventDate || calState === "booked"}>
            Continue
          </Button>
        </LuxuryCard>
      ) : null}

      {step === 2 ? (
        <LuxuryCard>
          <h2>Time slot picker</h2>
          <div className="chip-row">
            {durations.map((d) => (
              <button
                key={d}
                type="button"
                className={`filter-chip${durationHours === d ? " filter-chip--active" : ""}`}
                onClick={() => setDurationHours(d)}
              >
                {d}h{d >= 4 ? "+" : ""}
              </button>
            ))}
          </div>
          <div className="slot-grid">
            {STAGEBOOK_TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                className={`slot-tile${startTime === slot ? " slot-tile--active" : ""}`}
                onClick={() => setStartTime(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
          <p className="text-muted">Ends at {endTime}</p>
          <div className="onboarding__actions">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button type="button" variant="primary" onClick={() => setStep(3)}>Continue</Button>
          </div>
        </LuxuryCard>
      ) : null}

      {step === 3 ? (
        <LuxuryCard>
          <h2>Geographic location</h2>
          <Field label="Venue address">
            <TextInput value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)} required />
          </Field>
          <div className="map-placeholder">
            <p>Interactive map container</p>
            <span>Pin dropped at {locationLabel}</span>
          </div>
          <div className="onboarding__actions">
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>Back</Button>
            <Button type="button" variant="primary" onClick={() => setStep(4)}>Continue</Button>
          </div>
        </LuxuryCard>
      ) : null}

      {step === 4 ? (
        <LuxuryCard>
          <h2>Offer details & custom terms</h2>
          <Field label="Event name">
            <TextInput value={eventName} onChange={(e) => setEventName(e.target.value)} required />
          </Field>
          <Field label="Event type">
            <TextInput value={eventType} onChange={(e) => setEventType(e.target.value)} />
          </Field>
          <Field label="Offer amount (ZAR)">
            <TextInput type="number" value={quotedPrice} onChange={(e) => setQuotedPrice(Number(e.target.value))} />
          </Field>
          <Field label="Special requests">
            <TextArea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} rows={3} />
          </Field>
          <Field label="Technical rider">
            <TextArea value={technicalRider} onChange={(e) => setTechnicalRider(e.target.value)} rows={3} />
          </Field>
          {error ? <p className="auth-form__error">{error}</p> : null}
          <div className="onboarding__actions">
            <Button type="button" variant="ghost" onClick={() => setStep(3)}>Back</Button>
            <Button type="submit" variant="primary">Send booking request</Button>
          </div>
        </LuxuryCard>
      ) : null}
    </form>
  );
}