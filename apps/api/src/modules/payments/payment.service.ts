import type { PayfastPaymentPhase } from "@stagebook/shared";
import { AppError } from "../../lib/errors";
import { bookingService } from "../bookings/booking.service";
import { payfastService } from "./payfast.service";

export class PaymentService {
  createCheckout(bookingId: string, phase: PayfastPaymentPhase, baseUrl: string) {
    const booking = bookingService.getById(bookingId);
    if (phase === "deposit" && !["agreement", "paid", "confirmed"].includes(booking.status)) {
      bookingService.transitionStatus(bookingId, "agreement");
    }
    return payfastService.createCheckout(bookingId, phase, baseUrl);
  }

  completeSandboxPayment(bookingId: string, phase: PayfastPaymentPhase) {
    if (!bookingId) {
      throw new AppError("Booking ID is required", 400);
    }
    if (phase === "deposit") {
      return bookingService.transitionStatus(bookingId, "paid");
    }
    return bookingService.transitionStatus(bookingId, "confirmed");
  }

  markDepositPaid(bookingId: string) {
    return this.completeSandboxPayment(bookingId, "deposit");
  }

  confirmBooking(bookingId: string) {
    return this.completeSandboxPayment(bookingId, "balance");
  }
}

export const paymentService = new PaymentService();
