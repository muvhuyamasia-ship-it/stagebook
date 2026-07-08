import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

export function SiteNav() {
  const { session, logout, isVerified } = useAuth();

  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        <Link to="/" className="site-nav__brand">
          <span className="site-nav__mark" aria-hidden="true" />
          <span>
            <span className="site-nav__name">StageBook</span>
            <span className="site-nav__tagline">Elite live bookings</span>
          </span>
        </Link>

        <nav className="site-nav__actions" aria-label="Primary">
          {session ? (
            <>
              {isVerified ? (
                <Button as="link" to="/app/discover" variant="ghost">
                  Marketplace
                </Button>
              ) : (
                <Button as="link" to="/onboarding" variant="ghost">
                  Complete verification
                </Button>
              )}
              <Button variant="outline" onClick={logout}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button as="link" to="/login" variant="ghost">
                Sign in
              </Button>
              <Button as="link" to="/signup?role=artist" variant="primary">
                Join as Artist
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}