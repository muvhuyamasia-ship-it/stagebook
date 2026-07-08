import { v4 as uuid } from "uuid";
import type { ContractRecord, ContractSignature, SignatureMethod, UserRole } from "@stagebook/shared";
import { AppError } from "../../lib/errors";
import { store } from "../../lib/inMemoryStore";

export class ContractService {
  generate(bookingId: string) {
    const booking = store.bookings.find((entry) => entry.id === bookingId);
    const artist = booking ? store.artists.find((entry) => entry.id === booking.artistProfileId) : undefined;
    const client = booking ? store.users.find((entry) => entry.id === booking.clientUserId) : undefined;

    if (!booking || !artist || !client) {
      throw new AppError("Booking context missing", 404);
    }

    const existing = store.contracts.find((entry) => entry.bookingId === bookingId);
    if (existing) {
      return existing;
    }

    const bodyMarkdown = [
      `# StageBook Performance Agreement`,
      ``,
      `## Artist Details`,
      `- Stage Name: ${artist.stageName}`,
      `- Location: ${artist.city}, ${artist.province}`,
      ``,
      `## Client Details`,
      `- Client: ${client.displayName}`,
      `- Email: ${client.email}`,
      ``,
      `## Event Details`,
      `- Event: ${booking.eventName}`,
      `- Type: ${booking.eventType}`,
      `- Date: ${booking.eventDate}`,
      `- Time: ${booking.startTime} - ${booking.endTime}`,
      `- Venue: ${booking.locationLabel}`,
      ``,
      `## Payment Terms`,
      `- Total Fee: R${booking.quotedPriceZar}`,
      `- Deposit: 30% to confirm`,
      `- Balance: 70% due 48 hours before event`,
      `- StageBook Commission: 5%`,
      ``,
      `## Cancellation Policy`,
      `- 14+ days: 100% refund`,
      `- 7-13 days: 75% refund`,
      `- Under 7 days: 50% refund`,
      ``,
      `## Special Requests`,
      booking.specialRequests ?? "None supplied",
      ``,
      `## Technical Rider`,
      booking.technicalRider ?? "Shared separately"
    ].join("\n");

    const contract: ContractRecord = {
      id: uuid(),
      bookingId,
      status: "pending_signatures",
      bodyMarkdown
    };

    store.contracts.push(contract);
    return contract;
  }

  requestRevision(bookingId: string, feedback?: string) {
    const contract = this.getByBookingId(bookingId);
    contract.status = "revision_requested";
    if (feedback?.trim()) {
      contract.bodyMarkdown = `${contract.bodyMarkdown}\n\n---\n**Amendment Request:** ${feedback.trim()}`;
    }
    return contract;
  }

  sign(input: {
    bookingId: string;
    signerUserId: string;
    signerRole: UserRole;
    method: SignatureMethod;
    value: string;
  }) {
    const contract = this.getByBookingId(input.bookingId);
    const signature: ContractSignature = {
      signerUserId: input.signerUserId,
      signerRole: input.signerRole,
      method: input.method,
      value: input.value,
      signedAt: new Date().toISOString()
    };

    if (input.signerRole === "client") {
      contract.clientSignature = signature;
    }

    if (input.signerRole === "artist" || input.signerRole === "representative") {
      contract.artistSignature = signature;
    }

    if (contract.clientSignature && contract.artistSignature) {
      contract.status = "signed";
      contract.pdfUrl = `https://contracts.stagebook.local/${contract.id}.pdf`;
    }

    return contract;
  }

  getByBookingId(bookingId: string) {
    const contract = store.contracts.find((entry) => entry.bookingId === bookingId);
    if (!contract) {
      throw new AppError("Contract not found", 404);
    }
    return contract;
  }
}

export const contractService = new ContractService();
