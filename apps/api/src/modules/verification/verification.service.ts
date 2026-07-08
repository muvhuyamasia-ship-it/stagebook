import type { IdentityVerificationRecord } from "@stagebook/shared";
import { AppError } from "../../lib/errors";
import { store } from "../../lib/inMemoryStore";

export class VerificationService {
  submit(record: IdentityVerificationRecord) {
    const artist = store.artists.find((entry) => entry.id === record.artistProfileId);
    if (!artist) {
      throw new AppError("Artist profile not found", 404);
    }

    const existing = store.verifications.find((entry) => entry.artistProfileId === record.artistProfileId);
    if (existing) {
      Object.assign(existing, record, { status: "pending" });
      return existing;
    }

    const verification: IdentityVerificationRecord = {
      ...record,
      status: "pending"
    };
    store.verifications.push(verification);
    return verification;
  }

  markVerified(artistProfileId: string) {
    const verification = store.verifications.find((entry) => entry.artistProfileId === artistProfileId);
    if (!verification) {
      throw new AppError("Verification request not found", 404);
    }
    verification.status = "verified";
    return verification;
  }
}

export const verificationService = new VerificationService();
