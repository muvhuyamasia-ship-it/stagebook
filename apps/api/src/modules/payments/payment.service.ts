import { AppError } from "../../lib/errors";
import { bookingService } from "../bookings/booking.service";

export class PaymentService {
  createCheckout(bookingId: string) {
    const booking = bookingService.transitionStatus(bookingId, "agreement").booking;
    const schedule = bookingService.buildPaymentSchedule(booking.quotedPriceZar, booking.eventDate);

    return {
      provider: "payfast",
      checkoutReference: `stagebook_${bookingId}`,
      escrowStatus: "authorized",
      deposit: schedule.depositAmountZar,
      balanceDueAt: schedule.balanceDueAt
    };
  }

  markDepositPaid(bookingId: string) {
    if (!bookingId) {
      throw new AppError("Booking ID is required", 400);
    }
    return bookingService.transitionStatus(bookingId, "paid");
  }

  confirmBooking(bookingId: string) {
    return bookingService.transitionStatus(bookingId, "confirmed");
  }
}

export const paymentService = new PaymentService();
