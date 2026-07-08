import { useStageBook } from "../../context/StageBookContext";
import { ArtistCard } from "../../components/artists/ArtistCard";
import { LuxuryCard } from "../../components/ui/LuxuryCard";
import { Field, TextInput } from "../../components/ui/Field";

const genres = ["all", "Afro House", "Jazz", "Classical", "Soul", "DJ"];

export function SearchPage() {
  const { filteredArtists, filters, setFilters } = useStageBook();

  return (
    <div className="page-stack">
      <LuxuryCard>
        <h1 className="page-title">Search & proximity</h1>
        <p className="page-copy">Deep exploration with budget, genre, date, and map-radius filters.</p>
        <div className="filter-grid">
          <Field label="Search query">
            <TextInput value={filters.query} onChange={(e) => setFilters({ query: e.target.value })} />
          </Field>
          <Field label="City">
            <TextInput value={filters.city} onChange={(e) => setFilters({ city: e.target.value })} />
          </Field>
          <Field label="Date">
            <TextInput type="date" value={filters.date} onChange={(e) => setFilters({ date: e.target.value })} />
          </Field>
          <Field label={`Budget min (ZAR): ${filters.minBudget.toLocaleString()}`}>
            <input
              className="sb-input"
              type="range"
              min={5000}
              max={100000}
              step={1000}
              value={filters.minBudget}
              onChange={(e) => setFilters({ minBudget: Number(e.target.value) })}
            />
          </Field>
          <Field label={`Budget max (ZAR): ${filters.maxBudget.toLocaleString()}`}>
            <input
              className="sb-input"
              type="range"
              min={5000}
              max={150000}
              step={1000}
              value={filters.maxBudget}
              onChange={(e) => setFilters({ maxBudget: Number(e.target.value) })}
            />
          </Field>
          <Field label={`Radius: ${filters.radiusKm} km`}>
            <input
              className="sb-input"
              type="range"
              min={5}
              max={200}
              value={filters.radiusKm}
              onChange={(e) => setFilters({ radiusKm: Number(e.target.value) })}
            />
          </Field>
        </div>
        <div className="chip-row">
          {genres.map((genre) => (
            <button
              key={genre}
              type="button"
              className={`filter-chip${filters.genre === genre ? " filter-chip--active" : ""}`}
              onClick={() => setFilters({ genre })}
            >
              {genre}
            </button>
          ))}
        </div>
      </LuxuryCard>

      <div className="map-placeholder">
        <p>Map proximity view</p>
        <span>
          Showing talent within {filters.radiusKm}km of {filters.city}
        </span>
      </div>

      <div className="results-grid">
        {filteredArtists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </div>
    </div>
  );
}