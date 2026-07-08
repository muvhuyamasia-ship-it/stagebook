import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ eyebrow, title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="auth-shell">
      <div className="auth-shell__glow auth-shell__glow--left" aria-hidden="true" />
      <div className="auth-shell__glow auth-shell__glow--right" aria-hidden="true" />

      <div className="auth-shell__layout">
        <aside className="auth-shell__aside">
          <Link to="/" className="auth-shell__brand">
            StageBook
          </Link>
          <p className="auth-shell__eyebrow">{eyebrow}</p>
          <h1 className="auth-shell__title">{title}</h1>
          <p className="auth-shell__subtitle">{subtitle}</p>

          <ul className="auth-shell__trust-list">
            <li>Bank-grade identity verification</li>
            <li>Escrow-protected deposits</li>
            <li>Contract-grade booking workflows</li>
          </ul>
        </aside>

        <section className="auth-shell__panel">
          <div className="auth-shell__card">{children}</div>
          {footer ? <div className="auth-shell__footer">{footer}</div> : null}
        </section>
      </div>
    </div>
  );
}