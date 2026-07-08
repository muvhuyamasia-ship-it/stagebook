import { Link } from "react-router-dom";
import { SiteShell } from "../components/SiteShell";
import { SectionHeading } from "../components/SectionHeading";
import { useSiteContent } from "../context/SiteContentContext";

export function AboutPage() {
  const { content } = useSiteContent();

  return (
    <SiteShell>
      <section className="page-hero page-hero--compact">
        <div>
          <span className="section-eyebrow">About Rasilwela Group</span>
          <h1>Built around software that makes the rest of the business easier to run.</h1>
          <p>
            Transport and security are planned subsidiaries, but the current website focuses on the software division:
            company email hosting, consulting, and business analysis.
          </p>
        </div>
        <div className="page-hero__card">
          <h3>Operational focus</h3>
          <p>{content.about.mission}</p>
          <div className="hero__actions">
            <Link to="/client" className="button button--ghost">
              View client dashboard
            </Link>
            <Link to="/admin" className="button button--accent">
              Open admin dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="content-section content-section--split">
        <div>
          <SectionHeading
            eyebrow="Story"
            title="A digital-first entry point for the group."
            description="The website gives visitors a clear view of the company today and leaves room for the transport and security brands later."
          />
          <p className="rich-copy">{content.about.story}</p>
        </div>

        <div className="value-stack">
          {content.about.values.map((value) => (
            <article className="value-card" key={value}>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section">
        <SectionHeading
          eyebrow="Delivery model"
          title="A simple path from conversation to rollout."
          description="We keep the software journey consultative so business analysis and implementation stay aligned."
        />

        <div className="card-grid card-grid--three">
          <article className="service-card">
            <span className="status-pill status-pill--soft">1</span>
            <h3>Discovery</h3>
            <p>Clarify goals, process gaps, and the systems required to support the team.</p>
          </article>
          <article className="service-card">
            <span className="status-pill status-pill--soft">2</span>
            <h3>Build</h3>
            <p>Deliver the software, email, and workflow tools with a responsive interface.</p>
          </article>
          <article className="service-card">
            <span className="status-pill status-pill--soft">3</span>
            <h3>Support</h3>
            <p>Admin-managed content and message handling keep the site easy to operate after launch.</p>
          </article>
        </div>
      </section>
    </SiteShell>
  );
}
