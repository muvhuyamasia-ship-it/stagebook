import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStageBook } from "../../context/StageBookContext";
import { useAuth } from "../../context/AuthContext";
import { LuxuryCard } from "../../components/ui/LuxuryCard";
import { Button } from "../../components/ui/Button";
import { TextArea } from "../../components/ui/Field";
import { SignaturePad } from "../../components/ui/SignaturePad";

export function ContractPage() {
  const { bookingId = "" } = useParams();
  const { getBooking, getContract, generateContract, signContract, requestAmendment } = useStageBook();
  const { session } = useAuth();
  const booking = getBooking(bookingId);
  const contract = getContract(bookingId);
  const [amendment, setAmendment] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [finalized, setFinalized] = useState(false);

  if (!booking) return <p>Booking not found.</p>;

  const role = session?.user.role === "client" ? "client" : "artist";

  return (
    <div className="page-stack">
      <LuxuryCard>
        <Link to={`/app/bookings/${bookingId}`}>← Booking detail</Link>
        <h1 className="page-title">Digital contract</h1>
        <p className="page-copy">Automated assembly, smart clauses, versioning, and dual signatures.</p>
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
                Request Amendment
              </Button>
            </LuxuryCard>
          </div>

          {contract.status !== "signed" ? (
            <LuxuryCard>
              <h2>Dual signature pads</h2>
              <label className="legal-check">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                I formally agree to the terms of this binding contract.
              </label>
              <SignaturePad
                label={role === "client" ? "Client signature" : "Artist / Representative signature"}
                onSave={(sig) => {
                  if (!agreed) return;
                  signContract(bookingId, role, sig);
                }}
              />
              <SignaturePad
                label="Counterparty signature (demo)"
                onSave={(sig) => signContract(bookingId, role === "client" ? "artist" : "client", sig)}
              />
            </LuxuryCard>
          ) : (
            <LuxuryCard className="success-panel">
              <h2>Contract finalized</h2>
              <p className="page-copy">Both signatures captured with audit timestamps. Dispatching secure PDF.</p>
              <Button variant="primary" onClick={() => setFinalized(true)}>
                Download PDF
              </Button>
              {finalized ? <p className="text-success">PDF ready: {contract.pdfUrl}</p> : null}
            </LuxuryCard>
          )}
        </>
      ) : null}
    </div>
  );
}