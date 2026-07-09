import { Link, router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { BOOKING_STATUS_LABEL, formatZar } from "@stagebook/shared";
import { BlurHeader } from "../../src/components/BlurHeader";
import { FloatingSurface } from "../../src/components/FloatingSurface";
import { PressableScale } from "../../src/components/PressableScale";
import { useAuth } from "../../src/context/AuthContext";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

export default function BookingDetailScreen() {
  const { bookingId = "" } = useLocalSearchParams<{ bookingId: string }>();
  const { getBooking, getArtist, acceptOffer, declineOffer, completeBooking } = useStageBook();
  const { session } = useAuth();
  const role = session?.user.role;
  const booking = getBooking(bookingId);
  const artist = booking ? getArtist(booking.artistProfileId) : undefined;

  if (!booking) {
    return (
      <BlurHeader
        title="Not found"
        subtitle="This booking is unavailable"
        leftSlot={
          <PressableScale haptic="selection" onPress={() => router.back()}>
            <Text style={styles.back}>←</Text>
          </PressableScale>
        }
      >
        <FloatingSurface>
          <Text style={styles.muted}>Return to Bookings to view your schedule.</Text>
        </FloatingSurface>
      </BlurHeader>
    );
  }

  return (
    <BlurHeader
      title={booking.eventName}
      subtitle={`${artist?.stageName ?? "Artist"} · ${booking.eventDate}`}
      leftSlot={
        <PressableScale haptic="selection" onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </PressableScale>
      }
    >
      <FloatingSurface>
        <Text style={styles.gold}>{formatZar(booking.quotedPriceZar)}</Text>
        <Text style={styles.status}>{BOOKING_STATUS_LABEL[booking.status]}</Text>
      </FloatingSurface>

      {(role === "artist" || role === "representative") && booking.status === "request_sent" ? (
        <FloatingSurface>
          <Text style={styles.section}>Decision</Text>
          <PressableScale
            style={styles.btn}
            haptic="medium"
            onPress={() => void acceptOffer(booking.id)}
          >
            <Text style={styles.btnText}>Accept offer</Text>
          </PressableScale>
          <PressableScale
            style={styles.btnOutline}
            haptic="selection"
            onPress={() => void declineOffer(booking.id)}
          >
            <Text style={styles.btnOutlineText}>Decline request</Text>
          </PressableScale>
        </FloatingSurface>
      ) : null}

      {(role === "artist" || role === "representative") &&
      ["paid", "confirmed"].includes(booking.status) ? (
        <FloatingSurface>
          <Text style={styles.section}>Post-event</Text>
          <Text style={styles.muted}>
            Mark complete after the event to release earnings to your available balance.
          </Text>
          <PressableScale
            style={styles.btn}
            haptic="medium"
            onPress={() => void completeBooking(booking.id)}
          >
            <Text style={styles.btnText}>Mark engagement complete</Text>
          </PressableScale>
        </FloatingSurface>
      ) : null}

      <FloatingSurface>
        <Text style={styles.muted}>Venue: {booking.locationLabel}</Text>
        <Text style={styles.muted}>
          Time: {booking.startTime} – {booking.endTime}
        </Text>
        <Link href={`/messages/${bookingId}`} asChild>
          <PressableScale style={styles.btn} haptic="medium">
            <Text style={styles.btnText}>Messages & negotiation</Text>
          </PressableScale>
        </Link>
        <Link href={`/bookings/${bookingId}/contract`} asChild>
          <PressableScale style={styles.btnOutline} haptic="selection">
            <Text style={styles.btnOutlineText}>Contract</Text>
          </PressableScale>
        </Link>
        <Link href={`/bookings/${bookingId}/payment`} asChild>
          <PressableScale style={styles.btnOutline} haptic="selection">
            <Text style={styles.btnOutlineText}>PayFast payment</Text>
          </PressableScale>
        </Link>
      </FloatingSurface>
    </BlurHeader>
  );
}

const styles = StyleSheet.create({
  back: {
    ...theme.typography.headline,
    color: theme.colors.gold
  },
  section: {
    ...theme.typography.overline,
    color: theme.colors.gold
  },
  muted: {
    ...theme.typography.body,
    color: theme.colors.textMuted
  },
  gold: {
    ...theme.typography.metric,
    color: theme.colors.gold
  },
  status: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    fontWeight: "700"
  },
  btn: {
    backgroundColor: theme.colors.gold,
    paddingVertical: 14,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    marginTop: 4
  },
  btnText: {
    ...theme.typography.body,
    color: "#1a1408",
    fontWeight: "700"
  },
  btnOutline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderGold,
    paddingVertical: 14,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    marginTop: 4
  },
  btnOutlineText: {
    ...theme.typography.body,
    color: theme.colors.gold,
    fontWeight: "600"
  }
});