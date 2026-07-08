import type { PaymentSchedule } from "./business-logic";

export const PAYFAST_SANDBOX_PROCESS_URL = "https://sandbox.payfast.co.za/eng/process";
export const PAYFAST_SANDBOX_MERCHANT_ID = "10000100";
export const PAYFAST_SANDBOX_MERCHANT_KEY = "46f0cd694581a";

export type PayfastPaymentPhase = "deposit" | "balance";

export interface PayfastCheckoutSession {
  provider: "payfast";
  phase: PayfastPaymentPhase;
  bookingId: string;
  merchantId: string;
  merchantKey: string;
  amountZar: number;
  itemName: string;
  itemDescription: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  checkoutReference: string;
  sandbox: true;
  formAction: string;
  formFields: Record<string, string>;
  paymentSchedule: PaymentSchedule;
}

export function buildPayfastCheckoutSession(input: {
  bookingId: string;
  eventName: string;
  phase: PayfastPaymentPhase;
  schedule: PaymentSchedule;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}): PayfastCheckoutSession {
  const amountZar =
    input.phase === "deposit" ? input.schedule.depositAmountZar : input.schedule.balanceAmountZar;
  const checkoutReference = `stagebook_${input.bookingId}_${input.phase}`;
  const itemName =
    input.phase === "deposit"
      ? `StageBook deposit — ${input.eventName}`
      : `StageBook balance — ${input.eventName}`;

  return {
    provider: "payfast",
    phase: input.phase,
    bookingId: input.bookingId,
    merchantId: PAYFAST_SANDBOX_MERCHANT_ID,
    merchantKey: PAYFAST_SANDBOX_MERCHANT_KEY,
    amountZar,
    itemName,
    itemDescription: `${input.phase === "deposit" ? "30% escrow deposit" : "70% balance"} for ${input.eventName}`,
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
    notifyUrl: input.notifyUrl,
    checkoutReference,
    sandbox: true,
    formAction: PAYFAST_SANDBOX_PROCESS_URL,
    formFields: {
      merchant_id: PAYFAST_SANDBOX_MERCHANT_ID,
      merchant_key: PAYFAST_SANDBOX_MERCHANT_KEY,
      amount: amountZar.toFixed(2),
      item_name: itemName,
      item_description: input.eventName,
      m_payment_id: checkoutReference,
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      notify_url: input.notifyUrl
    },
    paymentSchedule: input.schedule
  };
}