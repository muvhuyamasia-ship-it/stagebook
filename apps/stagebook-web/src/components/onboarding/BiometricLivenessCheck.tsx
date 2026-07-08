import { useEffect, useRef } from "react";
import type { BiometricState } from "../../types/auth";
import { Button } from "../ui/Button";

interface BiometricLivenessCheckProps {
  state: BiometricState;
  onChange: (next: BiometricState) => void;
}

export function BiometricLivenessCheck({ state, onChange }: BiometricLivenessCheckProps) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  function startScan() {
    if (state.status === "scanning" || state.status === "liveness") return;

    onChange({ ...state, status: "aligning", progress: 8, attempts: state.attempts + 1 });

    window.setTimeout(() => {
      onChange({ ...state, status: "scanning", progress: 20, attempts: state.attempts + 1 });

      let progress = 20;
      timerRef.current = window.setInterval(() => {
        progress += 9;
        if (progress >= 72) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          onChange({ ...state, status: "liveness", progress: 72, attempts: state.attempts + 1 });

          window.setTimeout(() => {
            onChange({ ...state, status: "passed", progress: 100, attempts: state.attempts + 1 });
          }, 1400);
          return;
        }
        onChange({ ...state, status: "scanning", progress, attempts: state.attempts + 1 });
      }, 260);
    }, 900);
  }

  const statusLabel =
    state.status === "idle"
      ? "Ready for face scan"
      : state.status === "aligning"
        ? "Align your face within the oval"
        : state.status === "scanning"
          ? "Capturing facial geometry…"
          : state.status === "liveness"
            ? "Liveness challenge: please blink"
            : state.status === "passed"
              ? "Biometric verification passed"
              : "Scan failed — try again";

  return (
    <div className="biometric-check">
      <div className={`biometric-check__viewport biometric-check__viewport--${state.status}`}>
        <div className="biometric-check__camera" aria-hidden="true">
          <div className="biometric-check__grid" />
          <div className={`biometric-check__oval${state.status === "passed" ? " biometric-check__oval--passed" : ""}`}>
            {state.status === "scanning" || state.status === "liveness" ? (
              <span className="biometric-check__sweep" />
            ) : null}
            {state.status === "passed" ? <span className="biometric-check__check">✓</span> : null}
          </div>
          {state.status === "liveness" ? <span className="biometric-check__blink-prompt">Blink now</span> : null}
        </div>

        <div className="biometric-check__meta">
          <p className="biometric-check__title">{statusLabel}</p>
          <p className="biometric-check__copy">
            Live face match confirms you are the document holder. Lighting is normalized automatically for
            accurate liveness detection.
          </p>

          <div className="progress-bar progress-bar--gold">
            <span className="progress-bar__fill" style={{ width: `${state.progress}%` }} />
          </div>

          <div className="biometric-check__signals">
            <span className={state.progress >= 25 ? "is-live" : ""}>Face detected</span>
            <span className={state.progress >= 55 ? "is-live" : ""}>Depth mapped</span>
            <span className={state.progress >= 85 ? "is-live" : ""}>Liveness confirmed</span>
          </div>

          {state.status !== "passed" ? (
            <Button type="button" variant="primary" onClick={startScan} disabled={state.status === "scanning" || state.status === "liveness"}>
              {state.status === "idle" ? "Start biometric scan" : "Continue scan"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}