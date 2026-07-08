import { Link, useParams } from "react-router-dom";
import { formatZar } from "@stagebook/shared";
import { useStageBook } from "../../context/StageBookContext";
import { LuxuryCard } from "../../components/ui/LuxuryCard";
import { Button } from "../../components/ui/Button";

export function ArtistProfilePage() {
  const { artistId = "" } = useParams();
  const { getArtist, getCalendarState } = useStageBook();
  const artist = getArtist(artistId);

  if (!artist) {
    return <p>Artist not found.</p>;
  }

  const previewDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    return { iso, state: getCalendarState(artist.id, iso) };
  });

  return (
    <div className="page-stack">
      <div className="profile-hero">
        <div className="profile-hero__banner" />
        <div className="profile-hero__content">
          <h1>{artist.stageName}</h1>
          <p>{artist.city} · ⭐ {artist.rating} ({artist.reviewCount} reviews)</p>
          <div className="profile-hero__cta">
            <Button as="link" to={`/app/bookings/new?artist=${artist.id}`} variant="primary">
              Book Now
            </Button>
            <Button as="link" to="/app/messages" variant="outline">
              Message
            </Button>
          </div>
        </div>
      </div>

      <LuxuryCard>
        <h2>Biography</h2>
        <p className="page-copy">{artist.bio}</p>
        <div className="chip-row">
          {artist.genres.map((g) => (
            <span key={g} className="genre-chip">{g}</span>
          ))}
        </div>
        <p className="metric-text">From {formatZar(artist.basePriceZar)}</p>
      </LuxuryCard>

      <LuxuryCard>
        <h2>Availability preview</h2>
        <div className="mini-calendar">
          {previewDates.map((d) => (
            <span key={d.iso} className={`mini-cal-day mini-cal-day--${d.state}`}>
              {d.iso.slice(8)}
            </span>
          ))}
        </div>
      </LuxuryCard>

      <Link to="/app/discover">← Back to discover</Link>
    </div>
  );
}