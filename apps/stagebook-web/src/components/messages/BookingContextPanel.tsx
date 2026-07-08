import type { BookingContextItem } from "@stagebook/shared";
import { LuxuryCard } from "../ui/LuxuryCard";

export function BookingContextPanel({ items }: { items: BookingContextItem[] }) {
  return (
    <LuxuryCard className="context-panel">
      <h2>Booking context</h2>
      <p className="page-copy">Historical parameters for this negotiation thread.</p>
      <ul className="context-list">
        {items.map((item) => (
          <li key={item.id}>
            <span className="label-sm">{item.label}</span>
            <span className="value-lg">{item.value}</span>
          </li>
        ))}
      </ul>
    </LuxuryCard>
  );
}