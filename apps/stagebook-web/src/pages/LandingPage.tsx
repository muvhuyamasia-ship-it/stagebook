import { Link } from "react-router-dom";
import { BrandShowcase } from "../components/landing/BrandShowcase";
import { SiteNav } from "../components/layout/SiteNav";
import { LuxuryCard } from "../components/ui/LuxuryCard";
import { Button } from "../components/ui/Button";
import { AVAILABILITY_LABEL, MOCK_ARTISTS, formatZar } from "@stagebook/shared";

const artists = MOCK_ARTISTS;

const highlights = [
  "Biometric identity verification",
  "Escrow-protected deposits",
  "Live negotiation chat",
  "Contract signatures & audit trail"
];

export function LandingPage() {
  return (
    <div className="landing">
      <SiteNav />

      <section className="landing-hero">
        <div className="landing-hero__glow landing-hero__glow--gold" aria-hidden="true" />
        <div className="landing-hero__glow landing-hero__glow--teal" aria-hidden="true" />

        <div className="landing-hero__inner">
          <div className="landing-hero__copy">
            <p className="landing-hero__eyebrow">StageBook · Luxury Live Bookings</p>
            <h1 className="landing-hero__title">
              Where elite talent meets
              <span> impeccable events.</span>
            </h1>
            <p className="landing-hero__subtitle">
              A premium marketplace for artists, representatives, and clients — with verified identities,
              protected payments, and contract-grade booking workflows from first inquiry to final encore.
            </p>

            <div className="landing-hero__cta-row">
              <Button as="link" to="/signup?role=artist" variant="primary" className="sb-btn--xl">
                Join as Artist
              </Button>
              <Button as="link" to="/signup?role=client" variant="secondary" className="sb-btn--xl">
                Book Elite Talent
              </Button>
            </div>

            <ul className="landing-hero__highlights">
              {highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="landing-hero__showcase">
            <LuxuryCard>
              <p className="showcase-card__label">Featured this week</p>
              <div className="showcase-card__artist">
                <div className="showcase-card__avatar" aria-hidden="true" />
                <div>
                  <h3>{artists[0].stageName}</h3>
                  <p>{artists[0].city} · ★ {artists[0].rating}</p>
                </div>
                <span className="status-pill">{AVAILABILITY_LABEL[artists[0].availabilityStatus]}</span>
              </div>
              <div className="showcase-card__genres">
                {artists[0].genres.map((genre: string) => (
                  <span key={genre} className="genre-tag">
                    {genre}
                  </span>
                ))}
              </div>
              <p className="showcase-card__price">From {formatZar(artists[0].basePriceZar)}</p>
              <p className="showcase-card__note">
                Verified profile · Escrow-ready · Contract templates included
              </p>
            </LuxuryCard>

            <div className="landing-hero__stats">
              <div>
                <p className="stat-value">4.9</p>
                <p className="stat-label">Average artist rating</p>
              </div>
              <div>
                <p className="stat-value">R2.4M+</p>
                <p className="stat-label">Escrow processed</p>
              </div>
              <div>
                <p className="stat-value">48h</p>
                <p className="stat-label">Verification turnaround</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BrandShowcase />

      <section className="landing-cta-band">
        <div className="landing-cta-band__inner">
          <div>
            <p className="section-eyebrow">Ready to enter the marketplace?</p>
            <h2 className="showcase-heading">Launch with confidence. Perform without compromise.</h2>
          </div>
          <div className="landing-cta-band__actions">
            <Button as="link" to="/signup?role=artist" variant="primary">
              Join as Artist
            </Button>
            <Button as="link" to="/signup?role=client" variant="outline">
              Book Elite Talent
            </Button>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} StageBook. Premium bookings for the live economy.</p>
        <Link to="/login">Already have an account? Sign in</Link>
      </footer>
    </div>
  );
}