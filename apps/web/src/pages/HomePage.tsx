import { Link } from "react-router-dom";
import { InquiryForm } from "../components/InquiryForm";
import { SiteShell } from "../components/SiteShell";
import { SectionHeading } from "../components/SectionHeading";
import { useSiteContent } from "../context/SiteContentContext";

export function HomePage() {
  const { content, loading, source } = useSiteContent();

  return (
    <SiteShell>
      <section className="hero">
        <div className="hero__copy">
          <span className="section-eyebrow">{content.hero.eyebrow}</span>
          <h1>{content.hero.title}</h1>
          <p className="hero__description">{content.hero.description}</p>

          <div className="hero__actions">
            <Link to={content.hero.primaryCtaHref} className="button button--accent">
              {content.hero.primaryCtaLabel}
            </Link>
            <Link to={content.hero.secondaryCtaHref} className="button button--ghost">
              {content.hero.secondaryCtaLabel}
            </Link>
          </div>

          <div className="hero__meta">
            <span className="status-pill status-pill--soft">
              {loading ? "Loading content..." : source === "api" ? "Admin-managed content" : "Preview content"}
            </span>
            <span className="status-pill">Transport and security in development</span>
          </div>
        </div>

        <aside className="hero__panel">
          <div className="hero-card">
            <p className="section-eyebrow">Active focus</p>
            <h3>Software services</h3>
            <p>Company email hosting and business analysis now. Transport and security later.</p>
          </div>
          <div className="hero-card hero-card--soft">
            <p className="section-eyebrow">Response model</p>
            <h3>{content.contact.responseTime}</h3>
            <p>Messages can continue through email or in-app chat from the client dashboard.</p>
          </div>
        </aside>
      </section>

      <section className="stats-grid">
        {content.about.stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="content-section">
        <SectionHeading
          eyebrow="Core services"
          title="A practical software stack for businesses that want clarity."
          description="Rasilwela Group keeps the active offering centered on software delivery, hosting, and analysis so the experience stays focused."
        />

        <div className="card-grid">
          {content.services.map((service) => (
            <article className="service-card" key={service.id}>
              <span className={`status-pill status-pill--${service.status}`}>{service.highlight}</span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section content-section--split">
        <div>
          <SectionHeading
            eyebrow="What the admin controls"
            title="Homepage copy, services, and support messaging can be edited without code changes."
            description="The admin dashboard is designed to manage homepage content and incoming messages from one place."
          />
          <ul className="check-list">
            {content.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="status-panel">
          <h3>Subsidiary rollout</h3>
          {content.subsidiaries.map((item) => (
            <div className="status-row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
              <span className={`status-pill status-pill--${item.status}`}>{item.highlight}</span>
            </div>
          ))}
          <div className="status-panel__actions">
            <Link to="/about" className="button button--ghost">
              Learn about the group
            </Link>
            <Link to="/software" className="button button--ghost">
              Open software page
            </Link>
            <Link to="/signup" className="button button--accent">
              Create an account
            </Link>
          </div>
        </div>
      </section>

      <section className="content-section content-section--split">
        <div>
          <SectionHeading
            eyebrow="Contact us"
            title="Start the conversation from the public website."
            description="Clients can send an inquiry here, then continue the response through email or the client dashboard inbox."
          />
          <div className="status-panel">
            <div className="status-row">
              <div>
                <strong>Email</strong>
                <p>{content.contact.email}</p>
              </div>
              <span className="status-pill status-pill--soft">Primary</span>
            </div>
            <div className="status-row">
              <div>
                <strong>Phone</strong>
                <p>{content.contact.phone}</p>
              </div>
              <span className="status-pill status-pill--soft">Support</span>
            </div>
            <div className="status-row">
              <div>
                <strong>Response time</strong>
                <p>{content.contact.responseTime}</p>
              </div>
              <span className="status-pill status-pill--soft">Admin tracked</span>
            </div>
          </div>
        </div>

        <InquiryForm
          title="Send a contact message"
          subtitle="Tell us whether you need company email hosting, software development, or business analysis."
          preferredReplyChannel="email"
        />
      </section>
    </SiteShell>
  );
}
