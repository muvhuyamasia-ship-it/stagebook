import { buildPayfastCheckoutSession, type PayfastPaymentPhase } from "@stagebook/shared";
import { bookingService } from "../bookings/booking.service";

export class PayfastService {
  createCheckout(bookingId: string, phase: PayfastPaymentPhase, baseUrl: string) {
    const booking = bookingService.getById(bookingId);
    const schedule = bookingService.buildPaymentSchedule(booking.quotedPriceZar, booking.eventDate);

    return buildPayfastCheckoutSession({
      bookingId,
      eventName: booking.eventName,
      phase,
      schedule,
      returnUrl: `${baseUrl}/api/payments/payfast/return?bookingId=${bookingId}&phase=${phase}`,
      cancelUrl: `${baseUrl}/api/payments/payfast/cancel?bookingId=${bookingId}&phase=${phase}`,
      notifyUrl: `${baseUrl}/api/payments/payfast/notify`
    });
  }
}

export const payfastService = new PayfastService();