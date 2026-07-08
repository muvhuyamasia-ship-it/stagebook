import { Link } from "react-router-dom";
import { useStageBook } from "../../context/StageBookContext";
import { ArtistCard } from "../../components/artists/ArtistCard";
import { LuxuryCard } from "../../components/ui/LuxuryCard";
import { TextInput } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";

export function DiscoverPage() {
  const { filteredArtists, filters, setFilters } = useStageBook();
  const featured = filteredArtists.slice(0, 3);

  return (
    <div className="page-stack">
      <LuxuryCard>
        <h1 className="page-title">Discover elite talent</h1>
        <p className="page-copy">Curated performers with verified identities, escrow-ready bookings, and contract automation.</p>
        <div className="search-bar">
          <TextInput
            placeholder="Search artists, genres, cities…"
            value={filters.query}
            onChange={(e) => setFilters({ query: e.target.value })}
          />
          <Button as="link" to="/app/search" variant="secondary">
            Advanced search
          </Button>
        </div>
      </LuxuryCard>

      <section>
        <div className="section-head">
          <h2>Featured talent carousel</h2>
          <Link to="/app/search">View all</Link>
        </div>
        <div className="card-carousel">
          {featured.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      </section>
    </div>
  );
}