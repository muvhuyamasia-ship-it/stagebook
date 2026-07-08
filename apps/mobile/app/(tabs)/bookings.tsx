import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BOOKING_STATUS_LABEL, formatZar } from "@stagebook/shared";
import { LuxuryCard } from "../../src/components/LuxuryCard";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

export default function BookingsScreen() {
  const { bookings, getArtist } = useStageBook();

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Bookings & Calendar</Text>
      <View style={styles.legend}>
        <Text style={styles.dotGreen}>● Available</Text>
        <Text style={styles.dotAmber}>● Partial</Text>
        <Text style={styles.dotRed}>● Booked</Text>
      </View>
      {bookings.map((booking) => {
        const artist = getArtist(booking.artistProfileId);
        return (
          <LuxuryCard key={booking.id}>
            <Text style={styles.name}>{booking.eventName}</Text>
            <Text style={styles.muted}>{artist?.stageName} · {booking.eventDate}</Text>
            <Text style={styles.gold}>{formatZar(booking.quotedPriceZar)}</Text>
            <Text style={styles.status}>{BOOKING_STATUS_LABEL[booking.status]}</Text>
            {booking.travelWarning ? <Text style={styles.warn}>{booking.travelWarning}</Text> : null}
          </LuxuryCard>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, gap: 12, paddingTop: 56 },
  title: { color: theme.colors.textPrimary, fontSize: 28, fontWeight: "700" },
  legend: { flexDirection: "row", gap: 12 },
  dotGreen: { color: theme.colors.success, fontSize: 12 },
  dotAmber: { color: theme.colors.warning, fontSize: 12 },
  dotRed: { color: theme.colors.danger, fontSize: 12 },
  name: { color: theme.colors.textPrimary, fontWeight: "700", fontSize: 17 },
  muted: { color: theme.colors.textMuted },
  gold: { color: theme.colors.gold, fontWeight: "700" },
  status: { color: theme.colors.warning, fontSize: 12, fontWeight: "700" },
  warn: { color: theme.colors.warning, fontSize: 12 }
});