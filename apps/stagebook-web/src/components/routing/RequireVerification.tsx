import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function RequireVerification({ children }: { children: React.ReactNode }) {
  const { session, isVerified, loading } = useAuth();

  if (loading) {
    return (
      <div className="route-loading">
        <div className="route-loading__spinner" />
        <p>Verifying access…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!isVerified) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}