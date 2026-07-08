const pillars = [
  {
    title: "Verified talent only",
    copy: "Every artist, representative, and high-value client passes document and biometric checks before marketplace access.",
    stat: "100%",
    statLabel: "Identity screened"
  },
  {
    title: "Escrow-first payments",
    copy: "30% deposits are held securely until milestones are met, with transparent release and refund workflows.",
    stat: "30%",
    statLabel: "Protected deposit"
  },
  {
    title: "Contract-grade bookings",
    copy: "Generated agreements, revision history, dual signatures, and downloadable audit trails for every event.",
    stat: "24h",
    statLabel: "Avg. turnaround"
  }
];

const logos = ["Aurum Events", "Velvet Rooms", "District Live", "Crown Hospitality", "Pulse Agency"];

export function BrandShowcase() {
  return (
    <section className="brand-showcase">
      <div className="brand-showcase__intro">
        <p className="section-eyebrow">Elite branding showcase</p>
        <h2 className="showcase-heading">The trust layer for luxury live experiences</h2>
        <p className="section-copy">
          StageBook is engineered for premium venues, agencies, and touring artists who expect discretion,
          compliance, and flawless execution.
        </p>
      </div>

      <div className="brand-showcase__grid">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="pillar-card">
            <p className="pillar-card__stat">{pillar.stat}</p>
            <p className="pillar-card__stat-label">{pillar.statLabel}</p>
            <h3>{pillar.title}</h3>
            <p>{pillar.copy}</p>
          </article>
        ))}
      </div>

      <div className="brand-showcase__marquee" aria-label="Trusted by leading brands">
        <p className="brand-showcase__marquee-label">Trusted by premium event brands</p>
        <div className="brand-showcase__logos">
          {logos.map((logo) => (
            <span key={logo} className="brand-showcase__logo">
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}