import { buildCalendarMonth } from "@stagebook/shared";
import type { BookingRequest, CalendarSlotState } from "@stagebook/shared";
import { StyleSheet, Text, View } from "react-native";
import { LuxuryCard } from "./LuxuryCard";
import { theme } from "../theme/theme";

interface CalendarMonthProps {
  artistId: string;
  bookings: BookingRequest[];
  getCalendarState: (artistId: string, date: string) => CalendarSlotState;
}

const stateColors: Record<CalendarSlotState, string> = {
  available: "rgba(16,185,129,0.25)",
  partial: "rgba(245,158,11,0.25)",
  booked: "rgba(239,68,68,0.25)",
  past: "rgba(55,65,81,0.35)"
};

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
      <Text style={styles.title}>Availability calendar</Text>
      <Text style={styles.muted}>Live slot states from confirmed bookings and locked deposits.</Text>
      <View style={styles.grid}>
        {cells.map((cell) => (
          <View
            key={cell.date}
            style={[styles.cell, { backgroundColor: stateColors[cell.state] }]}
          >
            <Text style={styles.day}>{cell.date.slice(-2)}</Text>
            {cell.bookingCount > 0 ? (
              <Text style={styles.count}>{cell.bookingCount}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </LuxuryCard>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.textPrimary, fontWeight: "700", fontSize: 17 },
  muted: { color: theme.colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cell: {
    width: "13%",
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  day: { color: theme.colors.textPrimary, fontWeight: "600", fontSize: 12 },
  count: { color: theme.colors.textMuted, fontSize: 9 }
});