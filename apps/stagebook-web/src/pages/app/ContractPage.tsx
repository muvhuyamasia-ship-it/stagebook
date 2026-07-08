import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStageBook } from "../../context/StageBookContext";
import { useAuth } from "../../context/AuthContext";
import { LuxuryCard } from "../../components/ui/LuxuryCard";
import { Button } from "../../components/ui/Button";
import { TextArea } from "../../components/ui/Field";
import { SignaturePad } from "../../components/ui/SignaturePad";

export function ContractPage() {
  const { bookingId = "" } = useParams();
  const { getBooking, getContract, generateContract, signContract, requestAmendment, loadContract } =
    useStageBook();
  const { session } = useAuth();
  const booking = getBooking(bookingId);
  const contract = getContract(bookingId);
  const [amendment, setAmendment] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadContract(bookingId);
  }, [bookingId, loadContract]);

  if (!booking || !session) return <p>Booking not found.</p>;

  const isClient = session.user.role === "client";
  const isArtistSide = session.user.role === "artist" || session.user.role === "representative";
  const mySignature = isClient ? contract?.clientSignature : contract?.artistSignature;
  const counterSignature = isClient ? contract?.artistSignature : contract?.clientSignature;

  async function saveSignature(dataUrl: string) {
    if (!agreed) return;
    setSaving(true);
    await signContract(bookingId, dataUrl);
    setSaving(false);
  }

  return (
    <div className="page-stack">
      <LuxuryCard>
        <Link to={`/app/bookings/${bookingId}`}>← Booking detail</Link>
        <h1 className="page-title">Digital contract</h1>
        <p className="page-copy">Review terms, agree legally, and execute with dual signature canvases.</p>
        {!contract ? (
          <Button variant="primary" onClick={() => generateContract(bookingId)}>
            Generate contract
          </Button>
        ) : null}
      </LuxuryCard>

      {contract ? (
        <>
          <div className="contract-split">
            <LuxuryCard>
              <h2>Contract document</h2>
              <pre className="contract-doc">{contract.bodyMarkdown}</pre>
            </LuxuryCard>
            <LuxuryCard>
              <h2>Request amendment</h2>
              <TextArea rows={4} value={amendment} onChange={(e) => setAmendment(e.target.value)} />
              <Button variant="outline" onClick={() => requestAmendment(bookingId, amendment)}>
                Request amendment
              </Button>
            </LuxuryCard>
          </div>

          <LuxuryCard>
            <h2>Signature status</h2>
            <div className="signature-status-grid">
              <div>
                <p className="label-sm">Client</p>
                <p className={contract.clientSignature ? "text-success" : "text-muted"}>
                  {contract.clientSignature
                    ? `Signed ${new Date(contract.clientSignature.signedAt).toLocaleString()}`
                    : "Awaiting signature"}
                </p>
                {contract.clientSignature ? (
                  <img src={contract.clientSignature.value} alt="Client signature" className="signature-preview" />
                ) : null}
              </div>
              <div>
                <p className="label-sm">Artist / Representative</p>
                <p className={contract.artistSignature ? "text-success" : "text-muted"}>
                  {contract.artistSignature
                    ? `Signed ${new Date(contract.artistSignature.signedAt).toLocaleString()}`
                    : "Awaiting signature"}
                </p>
                {contract.artistSignature ? (
                  <img src={contract.artistSignature.value} alt="Artist signature" className="signature-preview" />
                ) : null}
              </div>
            </div>
          </LuxuryCard>

          {contract.status !== "signed" && (isClient || isArtistSide) ? (
            <LuxuryCard>
              <h2>Your signature</h2>
              <label className="legal-check">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                I formally agree to the terms of this binding contract.
              </label>
              {mySignature ? (
                <p className="text-success">Your signature is on file.</p>
              ) : (
                <SignaturePad
                  label={isClient ? "Client signature canvas" : "Artist / Representative signature canvas"}
                  onSave={saveSignature}
                  disabled={!agreed || saving}
                />
              )}
              {counterSignature ? (
                <p className="text-muted">Counterparty has signed. Awaiting your execution to finalize.</p>
              ) : null}
            </LuxuryCard>
          ) : null}

          {contract.status === "signed" ? (
            <LuxuryCard className="success-panel">
              <h2>Contract finalized</h2>
              <p className="page-copy">Both signatures captured with audit timestamps.</p>
              {contract.pdfUrl ? (
                <a href={contract.pdfUrl} className="text-gold">
                  Download secure PDF
                </a>
              ) : null}
              <Button as="link" to={`/app/bookings/${bookingId}/payment`} variant="primary">
                Proceed to PayFast deposit
              </Button>
            </LuxuryCard>
          ) : null}
        </>
      ) : null}
    </div>
  );
}