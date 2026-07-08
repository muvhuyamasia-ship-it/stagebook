import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthShell({
  title,
  subtitle,
  sideTitle,
  sideCopy,
  children
}: {
  title: string;
  subtitle: string;
  sideTitle: string;
  sideCopy: string[];
  children: ReactNode;
}) {
  return (
    <div className="auth-shell">
      <section className="auth-shell__panel">
        <Link to="/" className="brand brand--auth">
          <span className="brand__mark">R</span>
          <span className="brand__copy">
            <strong>Rasilwela Group</strong>
            <small>Software, email hosting, business analysis</small>
          </span>
        </Link>

        <div className="auth-shell__copy">
          <p className="section-eyebrow">Account access</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        <div className="feature-card">
          <p className="section-eyebrow">{sideTitle}</p>
          <ul className="feature-list">
            {sideCopy.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="auth-shell__form">{children}</section>
    </div>
  );
}
