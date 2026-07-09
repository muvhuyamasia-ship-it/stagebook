import { buildCalendarMonth } from "@stagebook/shared";
import type { BookingRequest, CalendarSlotState } from "@stagebook/shared";
import { LuxuryCard } from "../ui/LuxuryCard";

interface CalendarMonthProps {
  artistId: string;
  bookings: BookingRequest[];
  getCalendarState: (artistId: string, date: string) => CalendarSlotState;
}

export function CalendarMonth({ artistId, bookings, getCalendarState }: CalendarMonthProps) {
  const now = new Date();
  const cells = buildCalendarMonth({
    year: now.getFullYear(),
    month: now.getMonth(),
    artistId,
    bookings,
    getCalendarState
  });

  return (
    <LuxuryCard>
      <h2>Availability calendar</h2>
      <p className="page-copy">Live slot states from confirmed bookings and locked escrow deposits.</p>
      <div className="calendar-grid">
        {cells.map((cell) => (
          <div key={cell.date} className={`calendar-cell calendar-cell--${cell.state}`}>
            <span className="calendar-cell__day">{cell.date.slice(-2)}</span>
            {cell.bookingCount > 0 ? (
              <span className="calendar-cell__count">{cell.bookingCount}</span>
            ) : null}
          </div>
        ))}
      </div>
    </LuxuryCard>
  );
}