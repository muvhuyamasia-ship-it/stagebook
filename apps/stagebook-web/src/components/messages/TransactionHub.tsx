import { STAGEBOOK_TIME_SLOTS } from "@stagebook/shared";
import type { CounterOffer } from "@stagebook/shared";
import { LuxuryCard } from "../ui/LuxuryCard";
import { Button } from "../ui/Button";
import { Field, TextArea, TextInput } from "../ui/Field";

interface TransactionHubProps {
  currentPrice: number;
  currentStart: string;
  currentEnd: string;
  pendingOffer?: CounterOffer;
  onIssueCounter: (input: {
    priceZar: number;
    startTime: string;
    endTime: string;
    note: string;
  }) => void;
  onAcceptCounter: (offerId: string) => void;
  onDeclineCounter: (offerId: string) => void;
  onAcceptOffer: () => void;
  onDeclineOffer: () => void;
  counterPrice: number;
  counterStart: string;
  counterEnd: string;
  counterNote: string;
  onCounterPriceChange: (value: number) => void;
  onCounterStartChange: (value: string) => void;
  onCounterEndChange: (value: string) => void;
  onCounterNoteChange: (value: string) => void;
}

export function TransactionHub({
  currentPrice,
  currentStart,
  currentEnd,
  pendingOffer,
  onIssueCounter,
  onAcceptCounter,
  onDeclineCounter,
  onAcceptOffer,
  onDeclineOffer,
  counterPrice,
  counterStart,
  counterEnd,
  counterNote,
  onCounterPriceChange,
  onCounterStartChange,
  onCounterEndChange,
  onCounterNoteChange
}: TransactionHubProps) {
  return (
    <LuxuryCard className="chat-hub">
      <h2>Transaction hub</h2>
      <p className="page-copy">Issue, review, accept, or decline counter-offers. Adjust pricing or time slots.</p>

      <div className="hub-current">
        <p className="label-sm">Current terms</p>
        <p className="value-lg">R{currentPrice.toLocaleString("en-ZA")}</p>
        <p className="text-muted">{currentStart} – {currentEnd}</p>
      </div>

      {pendingOffer ? (
        <div className="hub-pending">
          <p className="label-sm">Pending counter-offer</p>
          <p className="value-lg">R{pendingOffer.proposedPriceZar.toLocaleString("en-ZA")}</p>
          <p className="text-muted">
            {pendingOffer.proposedStartTime}–{pendingOffer.proposedEndTime}
          </p>
          <div className="cta-row">
            <Button variant="primary" onClick={() => onAcceptCounter(pendingOffer.id)}>
              Accept counter
            </Button>
            <Button variant="outline" onClick={() => onDeclineCounter(pendingOffer.id)}>
              Decline counter
            </Button>
          </div>
        </div>
      ) : null}

      <Field label="Counter-offer amount (ZAR)">
        <TextInput
          type="number"
          value={counterPrice}
          onChange={(e) => onCounterPriceChange(Number(e.target.value))}
        />
      </Field>

      <div className="hub-slots">
        <Field label="Start time">
          <select
            className="sb-input"
            value={counterStart}
            onChange={(e) => onCounterStartChange(e.target.value)}
          >
            {STAGEBOOK_TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </Field>
        <Field label="End time">
          <select className="sb-input" value={counterEnd} onChange={(e) => onCounterEndChange(e.target.value)}>
            {STAGEBOOK_TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Counter note">
        <TextArea rows={2} value={counterNote} onChange={(e) => onCounterNoteChange(e.target.value)} />
      </Field>

      <div className="cta-row">
        <Button
          variant="secondary"
          onClick={() =>
            onIssueCounter({
              priceZar: counterPrice,
              startTime: counterStart,
              endTime: counterEnd,
              note: counterNote
            })
          }
        >
          Issue counter
        </Button>
        <Button variant="primary" onClick={onAcceptOffer}>
          Accept offer
        </Button>
        <Button variant="outline" onClick={onDeclineOffer}>
          Decline
        </Button>
      </div>
    </LuxuryCard>
  );
}