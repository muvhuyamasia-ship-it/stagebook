import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loadOnboarding, saveOnboarding } from "../../lib/onboarding";
import type { OnboardingState, OnboardingStepId } from "../../types/auth";
import { LuxuryCard } from "../ui/LuxuryCard";
import { Button } from "../ui/Button";
import { Field, TextArea, TextInput } from "../ui/Field";
import { BiometricLivenessCheck } from "./BiometricLivenessCheck";
import { IdDocumentScanner } from "./IdDocumentScanner";

const steps: Array<{ id: OnboardingStepId; label: string }> = [
  { id: "welcome", label: "Welcome" },
  { id: "profile", label: "Profile" },
  { id: "id_document", label: "ID Scan" },
  { id: "biometric", label: "Face Scan" },
  { id: "review", label: "Review" }
];

function stepIndex(step: OnboardingStepId) {
  return steps.findIndex((entry) => entry.id === step);
}

export function OnboardingWizard() {
  const { session, refreshVerification } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<OnboardingState>(() => {
    if (!session) throw new Error("Onboarding requires an authenticated session");
    return loadOnboarding(session.user.id) ?? {
      userId: session.user.id,
      currentStep: "welcome",
      profile: {
        displayName: session.user.displayName,
        stageName: "",
        city: "",
        bio: "",
        genres: []
      },
      idDocument: {
        documentType: "national_id",
        fileName: null,
        scanProgress: 0,
        status: "idle"
      },
      biometric: { status: "idle", progress: 0, attempts: 0 },
      verificationStatus: "unverified",
      completedAt: null
    };
  });

  const currentIndex = stepIndex(state.currentStep);
  const progressPercent = useMemo(() => ((currentIndex + 1) / steps.length) * 100, [currentIndex]);

  function updateState(next: OnboardingState) {
    setState(next);
    saveOnboarding(next);
  }

  function goToStep(step: OnboardingStepId) {
    updateState({ ...state, currentStep: step });
  }

  function canAdvance() {
    switch (state.currentStep) {
      case "welcome":
        return true;
      case "profile":
        return state.profile.displayName.trim().length > 1 && state.profile.city.trim().length > 1;
      case "id_document":
        return state.idDocument.status === "verified";
      case "biometric":
        return state.biometric.status === "passed";
      case "review":
        return true;
      default:
        return false;
    }
  }

  function handleNext() {
    if (!canAdvance()) return;
    const nextStep = steps[currentIndex + 1]?.id;
    if (nextStep) {
      goToStep(nextStep);
      return;
    }
    completeOnboarding();
  }

  function handleBack() {
    const prevStep = steps[currentIndex - 1]?.id;
    if (prevStep) goToStep(prevStep);
  }

  function completeOnboarding() {
    const completed: OnboardingState = {
      ...state,
      verificationStatus: "verified",
      completedAt: new Date().toISOString(),
      currentStep: "review"
    };
    updateState(completed);
    refreshVerification();
    navigate("/app/discover", { replace: true });
  }

  return (
    <div className="onboarding">
      <div className="onboarding__header">
        <p className="onboarding__eyebrow">Secure onboarding</p>
        <h1 className="onboarding__title">Verify your identity to access the marketplace</h1>
        <p className="onboarding__subtitle">
          StageBook protects artists, representatives, and clients with document verification and biometric
          liveness before any booking activity begins.
        </p>
      </div>

      <div className="onboarding__progress">
        <div className="progress-bar progress-bar--gold">
          <span className="progress-bar__fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <ol className="onboarding__steps">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className={`onboarding__step${index <= currentIndex ? " onboarding__step--active" : ""}${
                index < currentIndex ? " onboarding__step--done" : ""
              }`}
            >
              <span className="onboarding__step-index">{index + 1}</span>
              <span>{step.label}</span>
            </li>
          ))}
        </ol>
      </div>

      <LuxuryCard>
        {state.currentStep === "welcome" ? (
          <div className="onboarding__panel">
            <h2>Welcome, {session?.user.displayName}</h2>
            <p className="screen-copy">
              Your account is created. Before browsing talent or receiving bookings, complete a short
              verification flow designed for high-trust live events.
            </p>
            <ul className="onboarding__list">
              <li>Build your marketplace profile</li>
              <li>Scan a government-issued ID document</li>
              <li>Complete a biometric liveness face check</li>
              <li>Unlock discovery, booking, and payouts</li>
            </ul>
            <p className="onboarding__role-note">
              Signing in as <strong>{session?.user.role}</strong>. Verification is required for all roles.
            </p>
          </div>
        ) : null}

        {state.currentStep === "profile" ? (
          <div className="onboarding__panel onboarding__form">
            <h2>Profile setup</h2>
            <Field label="Display name">
              <TextInput
                value={state.profile.displayName}
                onChange={(event) =>
                  updateState({
                    ...state,
                    profile: { ...state.profile, displayName: event.target.value }
                  })
                }
              />
            </Field>
            {session?.user.role === "artist" ? (
              <Field label="Stage name" hint="How clients will discover you in the marketplace.">
                <TextInput
                  value={state.profile.stageName}
                  onChange={(event) =>
                    updateState({
                      ...state,
                      profile: { ...state.profile, stageName: event.target.value }
                    })
                  }
                />
              </Field>
            ) : null}
            <Field label="City">
              <TextInput
                value={state.profile.city}
                onChange={(event) =>
                  updateState({
                    ...state,
                    profile: { ...state.profile, city: event.target.value }
                  })
                }
              />
            </Field>
            <Field label="Bio" hint="A concise introduction for your marketplace presence.">
              <TextArea
                rows={4}
                value={state.profile.bio}
                onChange={(event) =>
                  updateState({
                    ...state,
                    profile: { ...state.profile, bio: event.target.value }
                  })
                }
              />
            </Field>
          </div>
        ) : null}

        {state.currentStep === "id_document" ? (
          <div className="onboarding__panel">
            <h2>ID document upload &amp; scan</h2>
            <IdDocumentScanner
              state={state.idDocument}
              onChange={(idDocument) => updateState({ ...state, idDocument })}
            />
          </div>
        ) : null}

        {state.currentStep === "biometric" ? (
          <div className="onboarding__panel">
            <h2>Biometric face scan &amp; liveness</h2>
            <BiometricLivenessCheck
              state={state.biometric}
              onChange={(biometric) => updateState({ ...state, biometric })}
            />
          </div>
        ) : null}

        {state.currentStep === "review" ? (
          <div className="onboarding__panel">
            <h2>Review &amp; submit</h2>
            <div className="review-grid">
              <div>
                <p className="review-label">Profile</p>
                <p className="review-value">{state.profile.displayName}</p>
                <p className="screen-copy">{state.profile.city}</p>
              </div>
              <div>
                <p className="review-label">ID document</p>
                <p className="review-value review-value--success">Verified</p>
                <p className="screen-copy">{state.idDocument.fileName}</p>
              </div>
              <div>
                <p className="review-label">Biometric liveness</p>
                <p className="review-value review-value--success">Passed</p>
                <p className="screen-copy">{state.biometric.attempts} attempt(s)</p>
              </div>
            </div>
            <p className="screen-copy">
              Submitting will activate your marketplace access with a verified trust badge on your profile.
            </p>
          </div>
        ) : null}

        <div className="onboarding__actions">
          <Button type="button" variant="ghost" onClick={handleBack} disabled={currentIndex === 0}>
            Back
          </Button>
          {state.currentStep === "review" ? (
            <Button type="button" variant="primary" onClick={completeOnboarding}>
              Activate marketplace access
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={handleNext} disabled={!canAdvance()}>
              Continue
            </Button>
          )}
        </div>
      </LuxuryCard>
    </div>
  );
}