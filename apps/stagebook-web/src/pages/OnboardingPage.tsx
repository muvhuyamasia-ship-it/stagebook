import { Navigate } from "react-router-dom";
import { OnboardingWizard } from "../components/onboarding/OnboardingWizard";
import { SiteNav } from "../components/layout/SiteNav";
import { useAuth } from "../context/AuthContext";

export function OnboardingPage() {
  const { session, isVerified } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (isVerified) {
    return <Navigate to="/app/discover" replace />;
  }

  return (
    <div className="onboarding-page">
      <SiteNav />
      <main className="onboarding-page__main">
        <OnboardingWizard />
      </main>
    </div>
  );
}