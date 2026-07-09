import type { ReactNode } from "react";
import { FloatingSurface } from "./FloatingSurface";

/** @deprecated Prefer FloatingSurface — kept for gradual migration */
export function LuxuryCard({ children }: { children: ReactNode }) {
  return <FloatingSurface>{children}</FloatingSurface>;
}