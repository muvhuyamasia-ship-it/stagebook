import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { BOOKING_STATUS_LABEL, formatZar } from "@stagebook/shared";
import { LuxuryCard } from "../../src/components/LuxuryCard";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

export default function BookingDetailScreen() {
  const { bookingId = "" } = useLocalSearchParams<{ bookingId: string }>();
  const { getBooking, getArtist } = useStageBook();
  const booking = getBooking(bookingId);
  const artist = booking ? getArtist(booking.artistProfileId) : undefined;

  if (!booking) {
    return (
      <ScrollView style={styles.page}>
        <Text style={styles.title}>Booking not found</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Link href="/(tabs)/bookings" asChild>
        <Pressable>
          <Text style={styles.back}>← Bookings</Text>
        </Pressable>
      </Link>
      <LuxuryCard>
        <Text style={styles.title}>{booking.eventName}</Text>
        <Text style={styles.muted}>
          {artist?.stageName} · {booking.eventDate}
        </Text>
        <Text style={styles.gold}>{formatZar(booking.quotedPriceZar)}</Text>
        <Text style={styles.status}>{BOOKING_STATUS_LABEL[booking.status]}</Text>
      </LuxuryCard>
      <LuxuryCard>
        <Text style={styles.muted}>Venue: {booking.locationLabel}</Text>
        <Text style={styles.muted}>
          Time: {booking.startTime} – {booking.endTime}
        </Text>
        <Link href={`/messages/${bookingId}`} asChild>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>Messages & negotiation</Text>
          </Pressable>
        </Link>
        <Link href={`/bookings/${bookingId}/contract`} asChild>
          <Pressable style={styles.btnOutline}>
            <Text style={styles.btnOutlineText}>Contract</Text>
          </Pressable>
        </Link>
        <Link href={`/bookings/${bookingId}/payment`} asChild>
          <Pressable style={styles.btnOutline}>
            <Text style={styles.btnOutlineText}>PayFast payment</Text>
          </Pressable>
        </Link>
      </LuxuryCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, gap: 12, paddingTop: 56 },
  back: { color: theme.colors.gold, marginBottom: 8 },
  title: { color: theme.colors.textPrimary, fontSize: 24, fontWeight: "700" },
  muted: { color: theme.colors.textMuted, marginTop: 4 },
  gold: { color: theme.colors.gold, fontWeight: "700", fontSize: 18, marginTop: 6 },
  status: { color: theme.colors.warning, fontWeight: "700", marginTop: 6 },
  btn: {
    backgroundColor: theme.colors.gold,
    padding: 12,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 12
  },
  btnText: { color: "#1a1408", fontWeight: "700" },
  btnOutline: {
    borderWidth: 1,
    borderColor: theme.colors.borderGold,
    padding: 12,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 8
  },
  btnOutlineText: { color: theme.colors.gold, fontWeight: "600" }
});