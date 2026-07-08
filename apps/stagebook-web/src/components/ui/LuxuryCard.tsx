import type { ReactNode } from "react";

export function LuxuryCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`lux-card ${className}`.trim()}>
      <div className="lux-card__inner">{children}</div>
    </div>
  );
}