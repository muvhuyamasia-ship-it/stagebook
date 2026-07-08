import { Link } from "react-router-dom";
import { SiteShell } from "../components/SiteShell";

export function NotFoundPage() {
  return (
    <SiteShell>
      <section className="page-hero page-hero--compact">
        <div>
          <span className="section-eyebrow">404</span>
          <h1>This page does not exist.</h1>
          <p>Use the navigation to return to the home page, login, or one of the dashboards.</p>
        </div>
        <div className="page-hero__card">
          <div className="hero__actions">
            <Link to="/" className="button button--accent">
              Back home
            </Link>
            <Link to="/login" className="button button--ghost">
              Login
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
