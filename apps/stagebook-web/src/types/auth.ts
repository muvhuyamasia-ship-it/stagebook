import type { User, UserRole } from "@stagebook/shared";

export type SignupRole = Extract<UserRole, "client" | "artist" | "representative">;

export interface AuthSession {
  token: string;
  user: User;
}

export type IdDocumentType = "national_id" | "passport" | "drivers_license";

export type OnboardingStepId =
  | "welcome"
  | "profile"
  | "id_document"
  | "biometric"
  | "review";

export interface OnboardingProfile {
  displayName: string;
  stageName: string;
  city: string;
  bio: string;
  genres: string[];
}

export interface IdDocumentState {
  documentType: IdDocumentType;
  fileName: string | null;
  scanProgress: number;
  status: "idle" | "uploading" | "scanning" | "verified";
}

export interface BiometricState {
  status: "idle" | "aligning" | "scanning" | "liveness" | "passed" | "failed";
  progress: number;
  attempts: number;
}

export interface OnboardingState {
  userId: string;
  currentStep: OnboardingStepId;
  profile: OnboardingProfile;
  idDocument: IdDocumentState;
  biometric: BiometricState;
  verificationStatus: "unverified" | "pending" | "verified";
  completedAt: string | null;
}