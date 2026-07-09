import type { CalendarSlotState } from "./business-logic";
import type { BookingRequest } from "./index";

export interface CalendarDayCell {
  date: string;
  state: CalendarSlotState;
  bookingCount: number;
}

export function buildCalendarMonth(input: {
  year: number;
  month: number;
  artistId: string;
  bookings: BookingRequest[];
  getCalendarState: (artistId: string, date: string) => CalendarSlotState;
}): CalendarDayCell[] {
  const { year, month, artistId, bookings, getCalendarState } = input;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: CalendarDayCell[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const bookingCount = bookings.filter(
      (booking) =>
        booking.artistProfileId === artistId &&
        booking.eventDate === date &&
        !["declined", "cancelled"].includes(booking.status)
    ).length;

    cells.push({
      date,
      state: getCalendarState(artistId, date),
      bookingCount
    });
  }

  return cells;
}