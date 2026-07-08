import type { PayfastCheckoutSession } from "@stagebook/shared";
import { formatZar, PAYFAST_SANDBOX_MERCHANT_ID } from "@stagebook/shared";
import { Button } from "../ui/Button";
import { LuxuryCard } from "../ui/LuxuryCard";

interface PayfastSandboxModalProps {
  session: PayfastCheckoutSession;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

export function PayfastSandboxModal({
  session,
  onConfirm,
  onClose,
  loading = false
}: PayfastSandboxModalProps) {
  return (
    <div className="payfast-modal-backdrop" role="dialog" aria-modal="true">
      <LuxuryCard className="payfast-modal">
        <p className="payfast-modal__eyebrow">PayFast Sandbox</p>
        <h2 className="payfast-modal__title">
          {session.phase === "deposit" ? "30% escrow deposit" : "70% balance payment"}
        </h2>
        <p className="page-copy">
          Simulated checkout using PayFast sandbox merchant credentials. No real funds are moved.
        </p>
        <dl className="payfast-modal__meta">
          <div>
            <dt>Merchant ID</dt>
            <dd>{PAYFAST_SANDBOX_MERCHANT_ID}</dd>
          </div>
          <div>
            <dt>Reference</dt>
            <dd>{session.checkoutReference}</dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd className="value-lg">{formatZar(session.amountZar)}</dd>
          </div>
          <div>
            <dt>Item</dt>
            <dd>{session.itemName}</dd>
          </div>
        </dl>
        <div className="cta-row">
          <Button variant="primary" onClick={onConfirm} disabled={loading}>
            {loading ? "Processing…" : "Pay with sandbox"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </LuxuryCard>
    </div>
  );
}