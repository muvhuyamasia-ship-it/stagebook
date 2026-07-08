import type { OnboardingState } from "../types/auth";

const STORAGE_PREFIX = "stagebook-web.onboarding.";

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function createDefaultOnboarding(userId: string, displayName: string): OnboardingState {
  return {
    userId,
    currentStep: "welcome",
    profile: {
      displayName,
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
    biometric: {
      status: "idle",
      progress: 0,
      attempts: 0
    },
    verificationStatus: "unverified",
    completedAt: null
  };
}

export function loadOnboarding(userId: string): OnboardingState | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingState;
  } catch {
    return null;
  }
}

export function saveOnboarding(state: OnboardingState) {
  localStorage.setItem(storageKey(state.userId), JSON.stringify(state));
}

export function isOnboardingComplete(state: OnboardingState | null) {
  return state?.verificationStatus === "verified" && state.completedAt !== null;
}

export function clearOnboarding(userId: string) {
  localStorage.removeItem(storageKey(userId));
}