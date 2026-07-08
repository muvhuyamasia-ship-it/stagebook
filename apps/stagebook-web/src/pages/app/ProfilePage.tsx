import { Link } from "react-router-dom";
import { ROLE_LABEL } from "@stagebook/shared";
import { useAuth } from "../../context/AuthContext";
import { loadOnboarding } from "../../lib/onboarding";
import { LuxuryCard } from "../../components/ui/LuxuryCard";
import { Button } from "../../components/ui/Button";

export function ProfilePage() {
  const { session, isVerified } = useAuth();
  const onboarding = session ? loadOnboarding(session.user.id) : null;

  return (
    <div className="page-stack">
      <LuxuryCard>
        <h1 className="page-title">Profile & verification</h1>
        <p className="page-copy">Account configuration, onboarding status, and legal verification records.</p>
        <div className="profile-grid">
          <div>
            <p className="label-sm">Display name</p>
            <p className="value-lg">{session?.user.displayName}</p>
          </div>
          <div>
            <p className="label-sm">Role</p>
            <p className="value-lg">{session ? ROLE_LABEL[session.user.role] : "—"}</p>
          </div>
          <div>
            <p className="label-sm">Verification</p>
            <p className={`value-lg ${isVerified ? "text-success" : "text-warning"}`}>
              {isVerified ? "Verified" : onboarding?.verificationStatus ?? "Unverified"}
            </p>
          </div>
        </div>
        {!isVerified ? (
          <Button as="link" to="/onboarding" variant="primary">
            Complete verification
          </Button>
        ) : null}
      </LuxuryCard>

      <LuxuryCard>
        <h2>Legal & compliance</h2>
        <ul className="bullet-list">
          <li>ID document: {onboarding?.idDocument.status ?? "pending"}</li>
          <li>Biometric liveness: {onboarding?.biometric.status ?? "pending"}</li>
          <li>Escrow policy: 30% deposit / 70% balance (48h pre-event)</li>
          <li>Cancellation tiers: 100% / 75% / 50% refund windows</li>
        </ul>
        <Link to="/app/bookings">View active bookings →</Link>
        <Link to="/app/notifications">Notification center →</Link>
      </LuxuryCard>
    </div>
  );
}