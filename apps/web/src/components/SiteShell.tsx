import { useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSiteContent } from "../context/SiteContentContext";
import { roleMatches } from "../lib/session";

export function SiteShell({ children }: { children: ReactNode }) {
  const { content, source } = useSiteContent();
  const { user, logout, ready } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeSubsidiaries = content.subsidiaries.filter((item) => item.status === "in_development");

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__topline">
          <span className="status-pill status-pill--soft">
            {source === "api" ? "Synced with API content" : "Local preview content"}
          </span>
          <span className="site-header__notice">
            {activeSubsidiaries.map((item) => item.title).join(" and ")} are in development.
          </span>
        </div>

        <div className="site-header__bar">
          <Link to="/" className="brand" onClick={closeMenu}>
            <span className="brand__mark">R</span>
            <span className="brand__copy">
              <strong>Rasilwela Group</strong>
              <small>Software services and digital operations</small>
            </span>
          </Link>

          <button
            type="button"
            className="menu-button"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span />
            <span />
          </button>

          <nav className={`site-nav ${menuOpen ? "site-nav--open" : ""}`}>
            <NavLink to="/" onClick={closeMenu} className={({ isActive }) => `site-nav__link ${isActive ? "is-active" : ""}`}>
              Home
            </NavLink>
            <NavLink to="/about" onClick={closeMenu} className={({ isActive }) => `site-nav__link ${isActive ? "is-active" : ""}`}>
              About
            </NavLink>
            <NavLink to="/software" onClick={closeMenu} className={({ isActive }) => `site-nav__link ${isActive ? "is-active" : ""}`}>
              Software
            </NavLink>
            <NavLink to="/client" onClick={closeMenu} className={({ isActive }) => `site-nav__link ${isActive ? "is-active" : ""}`}>
              Client Dashboard
            </NavLink>
            <NavLink to="/admin" onClick={closeMenu} className={({ isActive }) => `site-nav__link ${isActive ? "is-active" : ""}`}>
              Admin Dashboard
            </NavLink>
          </nav>

          <div className="site-header__actions">
            {ready && user ? (
              <>
                <span className="status-pill">{user.displayName}</span>
                <span className="status-pill status-pill--muted">
                  {roleMatches(user.role, "admin") ? "Admin" : "Client"}
                </span>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="button button--ghost" onClick={closeMenu}>
                  Login
                </Link>
                <Link to="/signup" className="button button--accent" onClick={closeMenu}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="page-shell">{children}</main>

      <footer className="site-footer">
        <div>
          <p className="section-eyebrow">Stay connected</p>
          <h3>Built to respond quickly and keep content fresh.</h3>
        </div>
        <div className="site-footer__details">
          <div>
            <span>Email</span>
            <strong>{content.contact.email}</strong>
          </div>
          <div>
            <span>Phone</span>
            <strong>{content.contact.phone}</strong>
          </div>
          <div>
            <span>Location</span>
            <strong>{content.contact.office}</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}
