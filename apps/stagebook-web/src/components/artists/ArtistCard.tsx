import { Link } from "react-router-dom";
import type { ArtistProfile } from "@stagebook/shared";
import { AVAILABILITY_LABEL, formatZar } from "@stagebook/shared";
import { LuxuryCard } from "../ui/LuxuryCard";

export function ArtistCard({ artist }: { artist: ArtistProfile }) {
  return (
    <LuxuryCard className="artist-card">
      <div className="artist-card__header">
        <div className="artist-card__avatar" aria-hidden="true" />
        <div className="artist-card__meta">
          <div className="artist-card__title-row">
            <h3>{artist.stageName}</h3>
            <span className="verified-chip">✓ Verified</span>
          </div>
          <p className="text-muted">{artist.city}, {artist.province}</p>
        </div>
        <span className={`avail-pill avail-pill--${artist.availabilityStatus}`}>
          {AVAILABILITY_LABEL[artist.availabilityStatus]}
        </span>
      </div>
      <div className="chip-row">
        {artist.genres.map((genre) => (
          <span key={genre} className="genre-chip">
            {genre}
          </span>
        ))}
      </div>
      <div className="artist-card__metrics">
        <span>⭐ {artist.rating} ({artist.reviewCount} reviews)</span>
        <span>From {formatZar(artist.basePriceZar)}</span>
      </div>
      <Link to={`/app/artists/${artist.id}`} className="artist-card__link">
        View profile →
      </Link>
    </LuxuryCard>
  );
}