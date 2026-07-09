import { Link, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BOOKING_STATUS_LABEL, formatZar } from "@stagebook/shared";
import { BlurHeader } from "../../src/components/BlurHeader";
import { CalendarMonth } from "../../src/components/CalendarMonth";
import { FloatingSurface } from "../../src/components/FloatingSurface";
import { PressableScale } from "../../src/components/PressableScale";
import { useAuth } from "../../src/context/AuthContext";
import { useSheets } from "../../src/context/SheetContext";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

export default function BookingsScreen() {
  const {
    bookings,
    getArtist,
    getCalendarState,
    myArtistProfile,
    refreshBookings,
    loadArtistDashboard
  } = useStageBook();
  const { openBookingWizard } = useSheets();
  const { session } = useAuth();
  const role = session?.user.role ?? "client";
  const userId = session?.user.id;
  const refreshInFlight = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      let active = true;

      void (async () => {
        if (refreshInFlight.current) return;
        refreshInFlight.current = true;
        try {
          await refreshBookings();
          if (active && role === "artist") {
            await loadArtistDashboard();
          }
        } finally {
          refreshInFlight.current = false;
        }
      })();

      return () => {
        active = false;
      };
    }, [userId, role, refreshBookings, loadArtistDashboard])
  );

  const inbox = useMemo(
    () =>
      role === "artist" || role === "representative"
        ? bookings.filter((b) => b.status === "request_sent")
        : [],
    [bookings, role]
  );

  const schedule = useMemo(
    () => bookings.filter((b) => !["declined", "cancelled"].includes(b.status)),
    [bookings]
  );

  const calendarArtistId = useMemo(
    () =>
      myArtistProfile?.id ??
      (role === "representative"
        ? bookings.find((b) => b.status !== "cancelled")?.artistProfileId
        : undefined),
    [bookings, myArtistProfile?.id, role]
  );

  return (
    <View style={styles.page}>
      <BlurHeader
        title="Bookings"
        subtitle="Calendar, requests, and live engagements"
        rightSlot={
          role === "client" ? (
            <PressableScale
              style={styles.newBtn}
              haptic="medium"
              onPress={() => openBookingWizard("artist-1")}
            >
              <Text style={styles.newBtnText}>New</Text>
            </PressableScale>
          ) : null
        }
      >
        <FloatingSurface>
          <View style={styles.legend}>
            <Text style={styles.dotGreen}>● Available</Text>
            <Text style={styles.dotAmber}>● Partial</Text>
            <Text style={styles.dotRed}>● Booked</Text>
          </View>
        </FloatingSurface>

        {inbox.length > 0 ? (
          <FloatingSurface>
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
                    <PressableScale style={styles.btnOutline} haptic="selection">
                      <Text style={styles.btnOutlineText}>Review</Text>
                    </PressableScale>
                  </Link>
                </View>
              );
            })}
          </FloatingSurface>
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
              <PressableScale haptic="selection">
                <FloatingSurface>
                  <Text style={styles.name}>{booking.eventName}</Text>
                  <Text style={styles.muted}>
                    {artist?.stageName} · {booking.eventDate}
                  </Text>
                  <Text style={styles.gold}>{formatZar(booking.quotedPriceZar)}</Text>
                  <Text style={styles.status}>{BOOKING_STATUS_LABEL[booking.status]}</Text>
                  {booking.travelWarning ? (
                    <Text style={styles.warn}>{booking.travelWarning}</Text>
                  ) : null}
                </FloatingSurface>
              </PressableScale>
            </Link>
          );
        })}
      </BlurHeader>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.obsidian
  },
  newBtn: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: theme.colors.gold
  },
  newBtnText: {
    ...theme.typography.caption,
    color: "#1a1408",
    fontWeight: "700"
  },
  section: {
    ...theme.typography.overline,
    color: theme.colors.gold
  },
  legend: {
    flexDirection: "row",
    gap: 12
  },
  dotGreen: {
    ...theme.typography.caption,
    color: theme.colors.success
  },
  dotAmber: {
    ...theme.typography.caption,
    color: theme.colors.warning
  },
  dotRed: {
    ...theme.typography.caption,
    color: theme.colors.danger
  },
  name: {
    ...theme.typography.headline,
    color: theme.colors.textPrimary
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
  warn: {
    ...theme.typography.caption,
    color: theme.colors.warning
  },
  inboxCard: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderFine
  },
  btnOutline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderGold,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 8
  },
  btnOutlineText: {
    ...theme.typography.caption,
    color: theme.colors.gold,
    fontWeight: "600"
  }
});