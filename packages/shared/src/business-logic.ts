export const DEPOSIT_RATE = 0.3;
export const BALANCE_RATE = 0.7;
export const PLATFORM_COMMISSION_RATE = 0.05;

export interface PaymentSchedule {
  totalAmountZar: number;
  depositAmountZar: number;
  balanceAmountZar: number;
  platformFeeZar: number;
  artistNetZar: number;
  balanceDueAt: string;
}

export interface BookingTravelInput {
  eventDate: string;
  startTime: string;
  endTime: string;
  latitude: number;
  longitude: number;
}

export type CalendarSlotState = "available" | "partial" | "booked" | "past";

export interface TravelGapAssessment {
  blocked: boolean;
  warning: boolean;
  message: string;
  requiredMinutes: number;
  availableMinutes: number;
}

export interface CancellationRefundResult {
  daysUntilEvent: number;
  refundPercentage: number;
  refundAmountZar: number;
  policyLabel: string;
}

export type NotificationType =
  | "booking_request"
  | "chat_message"
  | "counter_offer"
  | "payment_confirmed"
  | "contract_signature"
  | "payout_approved"
  | "travel_warning"
  | "cancellation";

export interface StageBookNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  bookingId?: string;
}

function toMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function haversineKm(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
) {
  const radius = 6371;
  const dLat = ((end.lat - start.lat) * Math.PI) / 180;
  const dLng = ((end.lng - start.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((start.lat * Math.PI) / 180) *
      Math.cos((end.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return radius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function buildPaymentSchedule(
  totalAmountZar: number,
  eventDate: string
): PaymentSchedule {
  const depositAmountZar = Math.round(totalAmountZar * DEPOSIT_RATE);
  const balanceAmountZar = Math.round(totalAmountZar * BALANCE_RATE);
  const platformFeeZar = Math.round(totalAmountZar * PLATFORM_COMMISSION_RATE);
  const artistNetZar = totalAmountZar - platformFeeZar;
  const dueDate = new Date(`${eventDate}T00:00:00.000Z`);
  dueDate.setUTCHours(dueDate.getUTCHours() - 48);

  return {
    totalAmountZar,
    depositAmountZar,
    balanceAmountZar,
    platformFeeZar,
    artistNetZar,
    balanceDueAt: dueDate.toISOString()
  };
}

export function calculateCancellationRefund(
  totalAmountZar: number,
  eventDate: string,
  cancelledAt = new Date()
): CancellationRefundResult {
  const event = new Date(`${eventDate}T00:00:00.000Z`);
  const daysUntilEvent = Math.max(
    0,
    Math.ceil((event.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60 * 24))
  );

  let refundPercentage = 0.5;
  let policyLabel = "Less than 7 days notice — 50% refund";

  if (daysUntilEvent >= 14) {
    refundPercentage = 1;
    policyLabel = "14+ days notice — 100% refund";
  } else if (daysUntilEvent >= 7) {
    refundPercentage = 0.75;
    policyLabel = "7–13 days notice — 75% refund";
  }

  return {
    daysUntilEvent,
    refundPercentage,
    refundAmountZar: Math.round(totalAmountZar * refundPercentage),
    policyLabel
  };
}

export function assessTravelGap(
  candidate: BookingTravelInput,
  existing: BookingTravelInput,
  minutesPerKm = 2
): TravelGapAssessment {
  if (candidate.eventDate !== existing.eventDate) {
    return {
      blocked: false,
      warning: false,
      message: "",
      requiredMinutes: 0,
      availableMinutes: 0
    };
  }

  const startMinutes = toMinutes(candidate.startTime);
  const endMinutes = toMinutes(candidate.endTime);
  const otherStart = toMinutes(existing.startTime);
  const otherEnd = toMinutes(existing.endTime);

  const distanceKm = haversineKm(
    { lat: candidate.latitude, lng: candidate.longitude },
    { lat: existing.latitude, lng: existing.longitude }
  );
  const requiredMinutes = Math.ceil(distanceKm * minutesPerKm);
  const availableMinutes = Math.max(
    Math.abs(startMinutes - otherEnd),
    Math.abs(otherStart - endMinutes)
  );

  if (availableMinutes === 0 || requiredMinutes === 0) {
    return {
      blocked: false,
      warning: false,
      message: "",
      requiredMinutes,
      availableMinutes
    };
  }

  if (availableMinutes < requiredMinutes) {
    const message = `🚨 Travel warning: Insufficient transit window between locations. Need ~${requiredMinutes} min, only ${availableMinutes} min available.`;
    return {
      blocked: availableMinutes < requiredMinutes * 0.6,
      warning: true,
      message,
      requiredMinutes,
      availableMinutes
    };
  }

  return {
    blocked: false,
    warning: false,
    message: "",
    requiredMinutes,
    availableMinutes
  };
}

export function slotOverlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
) {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(aEnd) > toMinutes(bStart);
}

export function formatZar(amount: number) {
  return `R${amount.toLocaleString("en-ZA")}`;
}