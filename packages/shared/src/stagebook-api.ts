import type {
  ArtistProfile,
  BookingRequest,
  BookingStatus,
  ChatMessage,
  ContractRecord,
  PaymentSchedule,
  PayfastCheckoutSession,
  PayfastPaymentPhase,
  SignatureMethod
} from "./index";

export class StagebookApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "StagebookApiError";
    this.status = status;
  }
}

export interface StagebookApiConfig {
  baseUrl?: string;
  getToken: () => string | null | undefined;
}

export interface CreateBookingInput {
  artistProfileId: string;
  eventName: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  guestCount: number;
  quotedPriceZar: number;
  specialRequests?: string;
  technicalRider?: string;
}

export interface BookingDecisionInput {
  status: BookingStatus;
  counterPriceZar?: number;
}

export interface CreateBookingResponse {
  booking: BookingRequest;
  paymentSchedule: unknown;
  notification?: unknown;
}

export interface BookingDecisionResponse {
  booking: BookingRequest;
  paymentSchedule: unknown;
}

export function createStagebookApi(config: StagebookApiConfig) {
  const baseUrl = (config.baseUrl ?? "").replace(/\/$/, "");

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    const token = config.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        typeof payload.message === "string"
          ? payload.message
          : typeof payload.error === "string"
            ? payload.error
            : "Request failed";
      throw new StagebookApiError(message, response.status);
    }

    return payload as T;
  }

  return {
    listArtists: (query?: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams();
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            params.set(key, String(value));
          }
        });
      }
      const suffix = params.toString() ? `?${params.toString()}` : "";
      return request<ArtistProfile[]>(`/api/artists${suffix}`);
    },

    listMyBookings: () => request<BookingRequest[]>("/api/bookings/me"),

    createBooking: (input: CreateBookingInput) =>
      request<CreateBookingResponse>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(input)
      }),

    bookingDecision: (bookingId: string, input: BookingDecisionInput) =>
      request<BookingDecisionResponse>(`/api/bookings/${bookingId}/decision`, {
        method: "POST",
        body: JSON.stringify(input)
      }),

    cancelBooking: (bookingId: string, reason: string) =>
      request<{ booking: BookingRequest }>(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason })
      }),

    listChat: (bookingId: string) =>
      request<ChatMessage[]>(`/api/bookings/${bookingId}/chat`),

    sendChat: (
      bookingId: string,
      input: { body: string; systemAction?: ChatMessage["systemAction"] }
    ) =>
      request<ChatMessage>(`/api/bookings/${bookingId}/chat`, {
        method: "POST",
        body: JSON.stringify(input)
      }),

    getContract: (bookingId: string) =>
      request<ContractRecord>(`/api/bookings/${bookingId}/contracts`),

    generateContract: (bookingId: string) =>
      request<ContractRecord>(`/api/bookings/${bookingId}/contracts/generate`, {
        method: "POST"
      }),

    requestContractRevision: (bookingId: string, feedback: string) =>
      request<ContractRecord>(`/api/bookings/${bookingId}/contracts/revision`, {
        method: "POST",
        body: JSON.stringify({ feedback })
      }),

    signContract: (
      bookingId: string,
      input: { method: SignatureMethod; value: string }
    ) =>
      request<ContractRecord>(`/api/bookings/${bookingId}/contracts/sign`, {
        method: "POST",
        body: JSON.stringify(input)
      }),

    createPayfastCheckout: (bookingId: string, phase: PayfastPaymentPhase) =>
      request<PayfastCheckoutSession>(`/api/bookings/${bookingId}/payments/checkout`, {
        method: "POST",
        body: JSON.stringify({ phase })
      }),

    completePayfastSandbox: (bookingId: string, phase: PayfastPaymentPhase) =>
      request<{ booking: BookingRequest; paymentSchedule: PaymentSchedule }>(
        `/api/bookings/${bookingId}/payments/sandbox/complete`,
        {
          method: "POST",
          body: JSON.stringify({ phase })
        }
      )
  };
}

export type StagebookApi = ReturnType<typeof createStagebookApi>;