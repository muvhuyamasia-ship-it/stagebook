import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BOOKING_STATUS_LABEL, formatZar } from "@stagebook/shared";
import { CalendarMonth } from "../../src/components/CalendarMonth";
import { LuxuryCard } from "../../src/components/LuxuryCard";
import { useAuth } from "../../src/context/AuthContext";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

export default function BookingsScreen() {
  const { bookings, getArtist, getCalendarState, myArtistProfile } = useStageBook();
  const { session } = useAuth();
  const role = session?.user.role ?? "client";

  const inbox =
    role === "artist" || role === "representative"
      ? bookings.filter((b) => b.status === "request_sent")
      : [];

  const schedule = bookings.filter((b) => !["declined", "cancelled"].includes(b.status));

  const calendarArtistId =
    myArtistProfile?.id ??
    (role === "representative"
      ? bookings.find((b) => b.status !== "cancelled")?.artistProfileId
      : undefined);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Bookings & Calendar</Text>
      {role === "client" ? (
        <Link href="/bookings/new" asChild>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>New booking</Text>
          </Pressable>
        </Link>
      ) : null}
      <View style={styles.legend}>
        <Text style={styles.dotGreen}>● Available</Text>
        <Text style={styles.dotAmber}>● Partial</Text>
        <Text style={styles.dotRed}>● Booked</Text>
      </View>

      {inbox.length > 0 ? (
        <LuxuryCard>
          <Text style={styles.section}>Booking request inbox</Text>
          {inbox.map((booking) => {
            const artist = getArtist(booking.artistProfileId);
            return (
              <View key={booking.id} style={styles.inboxCard}>
                <Text style={styles.name}>{booking.eventName}</Text>
                <Text style={styles.muted}>
                  {artist?.stageName} · {formatZar(booking.quotedPriceZar)}
                </Text>
                <Link href={`/bookings/${booking.id}`} asChild>
                  <Pressable style={styles.btnOutline}>
                    <Text style={styles.btnOutlineText}>Review</Text>
                  </Pressable>
                </Link>
              </View>
            );
          })}
        </LuxuryCard>
      ) : null}

      {calendarArtistId ? (
        <CalendarMonth
          artistId={calendarArtistId}
          bookings={bookings}
          getCalendarState={getCalendarState}
        />
      ) : null}

      {schedule.map((booking) => {
        const artist = getArtist(booking.artistProfileId);
        return (
          <Link key={booking.id} href={`/bookings/${booking.id}`} asChild>
            <Pressable>
              <LuxuryCard>
                <Text style={styles.name}>{booking.eventName}</Text>
                <Text style={styles.muted}>
                  {artist?.stageName} · {booking.eventDate}
                </Text>
                <Text style={styles.gold}>{formatZar(booking.quotedPriceZar)}</Text>
                <Text style={styles.status}>{BOOKING_STATUS_LABEL[booking.status]}</Text>
                {booking.travelWarning ? (
                  <Text style={styles.warn}>{booking.travelWarning}</Text>
                ) : null}
              </LuxuryCard>
            </Pressable>
          </Link>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, gap: 12, paddingTop: 56 },
  title: { color: theme.colors.textPrimary, fontSize: 28, fontWeight: "700" },
  section: { color: theme.colors.textPrimary, fontWeight: "700", fontSize: 17, marginBottom: 8 },
  legend: { flexDirection: "row", gap: 12 },
  dotGreen: { color: theme.colors.success, fontSize: 12 },
  dotAmber: { color: theme.colors.warning, fontSize: 12 },
  dotRed: { color: theme.colors.danger, fontSize: 12 },
  name: { color: theme.colors.textPrimary, fontWeight: "700", fontSize: 17 },
  muted: { color: theme.colors.textMuted },
  gold: { color: theme.colors.gold, fontWeight: "700" },
  status: { color: theme.colors.warning, fontSize: 12, fontWeight: "700" },
  warn: { color: theme.colors.warning, fontSize: 12 },
  inboxCard: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  btn: {
    backgroundColor: theme.colors.gold,
    padding: 12,
    borderRadius: 999,
    alignItems: "center"
  },
  btnText: { color: "#1a1408", fontWeight: "700" },
  btnOutline: {
    borderWidth: 1,
    borderColor: theme.colors.borderGold,
    padding: 10,
    borderRadius: 999,
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 8
  },
  btnOutlineText: { color: theme.colors.gold, fontWeight: "600" }
});