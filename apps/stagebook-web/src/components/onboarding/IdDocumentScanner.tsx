import { useRef, useState } from "react";
import type { IdDocumentState } from "../../types/auth";
import { Button } from "../ui/Button";

interface IdDocumentScannerProps {
  state: IdDocumentState;
  onChange: (next: IdDocumentState) => void;
}

const documentTypes = [
  { id: "national_id" as const, label: "National ID" },
  { id: "passport" as const, label: "Passport" },
  { id: "drivers_license" as const, label: "Driver's License" }
];

export function IdDocumentScanner({ state, onChange }: IdDocumentScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  function simulateScan(fileName: string) {
    onChange({
      ...state,
      fileName,
      status: "uploading",
      scanProgress: 0
    });

    let progress = 0;
    const uploadTimer = window.setInterval(() => {
      progress += 18;
      if (progress >= 45) {
        window.clearInterval(uploadTimer);
        onChange({
          ...state,
          fileName,
          status: "scanning",
          scanProgress: 45
        });

        let scanProgress = 45;
        const scanTimer = window.setInterval(() => {
          scanProgress += 11;
          if (scanProgress >= 100) {
            window.clearInterval(scanTimer);
            onChange({
              ...state,
              fileName,
              status: "verified",
              scanProgress: 100
            });
            return;
          }
          onChange({
            ...state,
            fileName,
            status: "scanning",
            scanProgress
          });
        }, 280);
      } else {
        onChange({
          ...state,
          fileName,
          status: "uploading",
          scanProgress: progress
        });
      }
    }, 220);
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    simulateScan(file.name);
  }

  return (
    <div className="id-scanner">
      <div className="id-scanner__types">
        {documentTypes.map((type) => (
          <button
            key={type.id}
            type="button"
            className={`id-scanner__type${state.documentType === type.id ? " id-scanner__type--active" : ""}`}
            onClick={() => onChange({ ...state, documentType: type.id })}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div
        className={`id-scanner__dropzone${dragActive ? " id-scanner__dropzone--active" : ""}${
          state.status === "verified" ? " id-scanner__dropzone--verified" : ""
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          handleFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="id-scanner__input"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        <div className="id-scanner__frame" aria-hidden="true">
          <span className="id-scanner__corner id-scanner__corner--tl" />
          <span className="id-scanner__corner id-scanner__corner--tr" />
          <span className="id-scanner__corner id-scanner__corner--bl" />
          <span className="id-scanner__corner id-scanner__corner--br" />
          {state.status === "scanning" ? <span className="id-scanner__scanline" /> : null}
        </div>

        <div className="id-scanner__content">
          {state.status === "idle" ? (
            <>
              <p className="id-scanner__title">Upload or scan your ID document</p>
              <p className="id-scanner__copy">
                Position your document within the frame. We extract details securely and never store raw
                images after verification.
              </p>
              <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
                Choose file
              </Button>
              <Button type="button" variant="outline" onClick={() => simulateScan("id-scan-capture.jpg")}>
                Simulate camera scan
              </Button>
            </>
          ) : null}

          {state.status === "uploading" || state.status === "scanning" ? (
            <>
              <p className="id-scanner__title">
                {state.status === "uploading" ? "Uploading document…" : "Scanning security features…"}
              </p>
              <p className="id-scanner__copy">{state.fileName}</p>
              <div className="progress-bar">
                <span className="progress-bar__fill" style={{ width: `${state.scanProgress}%` }} />
              </div>
              <p className="id-scanner__status">{state.scanProgress}% complete</p>
            </>
          ) : null}

          {state.status === "verified" ? (
            <>
              <p className="id-scanner__title id-scanner__title--success">Document verified</p>
              <p className="id-scanner__copy">
                {state.fileName} passed authenticity checks. Proceed to biometric liveness.
              </p>
            </>
          ) : null}
        </div>
      </div>

      <ul className="id-scanner__checks">
        <li className={state.scanProgress >= 30 ? "is-done" : ""}>Edge detection</li>
        <li className={state.scanProgress >= 60 ? "is-done" : ""}>Hologram analysis</li>
        <li className={state.scanProgress >= 100 ? "is-done" : ""}>Identity match ready</li>
      </ul>
    </div>
  );
}