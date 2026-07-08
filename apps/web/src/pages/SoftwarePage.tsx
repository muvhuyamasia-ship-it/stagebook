import { Link } from "react-router-dom";
import { InquiryForm } from "../components/InquiryForm";
import { SectionHeading } from "../components/SectionHeading";
import { SiteShell } from "../components/SiteShell";
import { useSiteContent } from "../context/SiteContentContext";

export function SoftwarePage() {
  const { content } = useSiteContent();
  const liveServices = content.services.filter((service) => service.status === "live");

  return (
    <SiteShell>
      <section className="page-hero">
        <div>
          <span className="section-eyebrow">Software subsidiary</span>
          <h1>Rasilwela Software is the live division clients can engage right now.</h1>
          <p>
            We are focusing this release on software development, company email hosting, and business analysis
            while transport and security continue in development.
          </p>
          <div className="hero__actions">
            <Link to="/signup" className="button button--accent">
              Create client account
            </Link>
            <Link to="/admin" className="button button--ghost">
              View admin tools
            </Link>
          </div>
        </div>

        <div className="page-hero__card">
          <h3>What clients can do today</h3>
          <p>Send inquiries, sign in, receive replies, and let the admin team update site content without code edits.</p>
          <ul className="check-list">
            <li>Company email hosting for your domain</li>
            <li>Business analyst consulting for clearer delivery</li>
            <li>Responsive website and dashboard workflow</li>
          </ul>
        </div>
      </section>

      <section className="content-section">
        <SectionHeading
          eyebrow="Live services"
          title="Software delivery built around real business operations."
          description="These offerings are already available on the live Rasilwela experience."
        />

        <div className="card-grid">
          {liveServices.map((service) => (
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
            eyebrow="Roadmap visibility"
            title="The other subsidiaries are visible now, even before they launch."
            description="Visitors can see where the group is headed without confusing the live software offer."
          />
          <div className="status-panel">
            {content.subsidiaries.map((item) => (
              <div className="status-row" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
                <span className={`status-pill status-pill--${item.status}`}>{item.highlight}</span>
              </div>
            ))}
          </div>
        </div>

        <InquiryForm
          title="Talk to the software team"
          subtitle="Send a contact-us message and let the admin reply by email or in-app chat."
          preferredReplyChannel="email"
        />
      </section>
    </SiteShell>
  );
}
