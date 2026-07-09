import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { STAGEBOOK_TIME_SLOTS } from "@stagebook/shared";
import { router } from "expo-router";
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import { useStageBook } from "../context/StageBookContext";
import { theme } from "../theme/theme";
import { PressableScale } from "./PressableScale";
import { useSheetBackdrop, useSheetSnapHaptic } from "./sheetBackdrop";

export interface BookingWizardOpenOptions {
  step?: number;
  submit?: boolean;
}

export interface BookingWizardSheetRef {
  open: (artistId: string, options?: BookingWizardOpenOptions) => void;
  close: () => void;
}

const durations = [1, 2, 3, 4] as const;

export const BookingWizardSheet = forwardRef<BookingWizardSheetRef, object>(
  function BookingWizardSheet(_props, ref) {
    const sheetRef = useRef<BottomSheet>(null);
    const renderBackdrop = useSheetBackdrop();
    const onSnap = useSheetSnapHaptic();
    const snapPoints = useMemo(() => ["72%", "94%"], []);
    const { getArtist, getCalendarState, createBooking } = useStageBook();

    const [artistId, setArtistId] = useState("artist-1");
    const [step, setStep] = useState(1);
    const [eventDate, setEventDate] = useState("2026-12-15");
    const [startTime, setStartTime] = useState("18:00");
    const [durationHours, setDurationHours] = useState(2);
    const [locationLabel, setLocationLabel] = useState("Sandton Convention Centre");
    const [quotedPrice, setQuotedPrice] = useState(18000);
    const [eventName, setEventName] = useState("");
    const [eventType, setEventType] = useState("Corporate");
    const [error, setError] = useState<string | null>(null);

    const artist = getArtist(artistId);
    const endTime = useMemo(() => {
      const [h, m] = startTime.split(":").map(Number);
      return `${String(h + durationHours).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }, [startTime, durationHours]);
    const calState = eventDate ? getCalendarState(artistId, eventDate) : "available";

    useImperativeHandle(ref, () => ({
      open: (nextArtistId: string, options?: BookingWizardOpenOptions) => {
        const nextArtist = getArtist(nextArtistId);
        const nextStep = Math.min(4, Math.max(1, options?.step ?? 1));
        const price = nextArtist?.basePriceZar ?? 18000;
        setArtistId(nextArtistId);
        setQuotedPrice(price);
        setStep(nextStep);
        setEventName(nextStep >= 4 ? "Annual Gala" : "");
        setError(null);
        sheetRef.current?.snapToIndex(0);
        if (options?.submit && nextStep === 4 && nextArtist) {
          void createBooking({
            artistId: nextArtistId,
            eventDate,
            startTime,
            endTime: `${String(Number(startTime.split(":")[0]) + durationHours).padStart(2, "0")}:${startTime.split(":")[1]}`,
            durationHours,
            locationLabel,
            latitude: -26.107,
            longitude: 28.054,
            quotedPriceZar: price,
            eventName: "Annual Gala",
            eventType,
            specialRequests: "",
            technicalRider: "",
            guestCount: 150
          }).then((result) => {
            if (!result.ok) {
              setError(result.error ?? "Unable to create booking");
              return;
            }
            sheetRef.current?.close();
            router.push(`/bookings/${result.bookingId}`);
          });
        }
      },
      close: () => sheetRef.current?.close()
    }));

    async function submitAtStep4(forArtistId = artistId) {
      const bookingArtist = getArtist(forArtistId);
      if (!bookingArtist) return;
      setError(null);
      const result = await createBooking({
        artistId: forArtistId,
        eventDate,
        startTime,
        endTime,
        durationHours,
        locationLabel,
        latitude: -26.107,
        longitude: 28.054,
        quotedPriceZar: quotedPrice,
        eventName: eventName.trim() || "Annual Gala",
        eventType,
        specialRequests: "",
        technicalRider: "",
        guestCount: 150
      });
      if (!result.ok) {
        setError(result.error ?? "Unable to create booking");
        return;
      }
      sheetRef.current?.close();
      router.push(`/bookings/${result.bookingId}`);
    }

    async function submit() {
      if (!artist) return;
      await submitAtStep4(artistId);
    }

    return (
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onChange={onSnap}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handle}
      >
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {!artist ? (
            <Text style={styles.title}>Artist not found</Text>
          ) : (
            <>
              <Text style={styles.eyebrow}>Booking wizard</Text>
              <Text style={styles.title}>Book {artist.stageName}</Text>
              <Text style={styles.subtitle}>Step {step} of 4</Text>

              <View style={styles.steps}>
                {["Date", "Time", "Location", "Offer"].map((label, index) => (
                  <View
                    key={label}
                    style={[styles.stepPill, step === index + 1 ? styles.stepPillActive : null]}
                  >
                    <Text style={[styles.stepText, step === index + 1 ? styles.stepTextActive : null]}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              {step === 1 ? (
                <View style={styles.panel}>
                  <Text style={styles.label}>Event date</Text>
                  <BottomSheetTextInput
                    style={styles.input}
                    value={eventDate}
                    onChangeText={setEventDate}
                    placeholderTextColor={theme.colors.textMuted}
                  />
                  <Text style={styles.hint}>Calendar state: {calState}</Text>
                  <PressableScale
                    style={styles.primaryBtn}
                    onPress={() => {
                      Keyboard.dismiss();
                      setStep(2);
                    }}
                  >
                    <Text style={styles.primaryText}>Continue</Text>
                  </PressableScale>
                </View>
              ) : null}

              {step === 2 ? (
                <View style={styles.panel}>
                  <Text style={styles.label}>Start time</Text>
                  <View style={styles.chipRow}>
                    {STAGEBOOK_TIME_SLOTS.slice(0, 8).map((slot) => (
                      <PressableScale
                        key={slot}
                        haptic="selection"
                        style={[styles.chip, startTime === slot ? styles.chipActive : null]}
                        onPress={() => setStartTime(slot)}
                      >
                        <Text style={styles.chipText}>{slot}</Text>
                      </PressableScale>
                    ))}
                  </View>
                  <Text style={styles.label}>Duration</Text>
                  <View style={styles.chipRow}>
                    {durations.map((hours) => (
                      <PressableScale
                        key={hours}
                        haptic="selection"
                        style={[styles.chip, durationHours === hours ? styles.chipActive : null]}
                        onPress={() => setDurationHours(hours)}
                      >
                        <Text style={styles.chipText}>{hours}h</Text>
                      </PressableScale>
                    ))}
                  </View>
                  <Text style={styles.hint}>Ends at {endTime}</Text>
                  <View style={styles.navRow}>
                    <PressableScale style={styles.secondaryBtn} onPress={() => setStep(1)}>
                      <Text style={styles.secondaryText}>Back</Text>
                    </PressableScale>
                    <PressableScale
                      style={styles.primaryBtn}
                      onPress={() => {
                        Keyboard.dismiss();
                        setStep(3);
                      }}
                    >
                      <Text style={styles.primaryText}>Continue</Text>
                    </PressableScale>
                  </View>
                </View>
              ) : null}

              {step === 3 ? (
                <View style={styles.panel}>
                  <Text style={styles.label}>Venue / location</Text>
                  <BottomSheetTextInput
                    style={styles.input}
                    value={locationLabel}
                    onChangeText={setLocationLabel}
                    placeholderTextColor={theme.colors.textMuted}
                  />
                  <View style={styles.navRow}>
                    <PressableScale style={styles.secondaryBtn} onPress={() => setStep(2)}>
                      <Text style={styles.secondaryText}>Back</Text>
                    </PressableScale>
                    <PressableScale
                      style={styles.primaryBtn}
                      onPress={() => {
                        Keyboard.dismiss();
                        setStep(4);
                      }}
                    >
                      <Text style={styles.primaryText}>Continue</Text>
                    </PressableScale>
                  </View>
                </View>
              ) : null}

              {step === 4 ? (
                <View style={styles.panel}>
                  <Text style={styles.label}>Event name</Text>
                  <BottomSheetTextInput
                    style={styles.input}
                    value={eventName}
                    onChangeText={setEventName}
                    placeholder="Annual gala"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                  <Text style={styles.label}>Event type</Text>
                  <BottomSheetTextInput
                    style={styles.input}
                    value={eventType}
                    onChangeText={setEventType}
                    placeholderTextColor={theme.colors.textMuted}
                  />
                  <Text style={styles.label}>Offer (ZAR)</Text>
                  <BottomSheetTextInput
                    style={styles.input}
                    value={String(quotedPrice)}
                    onChangeText={(value) => setQuotedPrice(Number(value) || 0)}
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  <View style={styles.navRow}>
                    <PressableScale style={styles.secondaryBtn} onPress={() => setStep(3)}>
                      <Text style={styles.secondaryText}>Back</Text>
                    </PressableScale>
                    <PressableScale style={styles.primaryBtn} haptic="medium" onPress={() => void submit()}>
                      <Text style={styles.primaryText}>Send request</Text>
                    </PressableScale>
                  </View>
                </View>
              ) : null}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: theme.colors.obsidianRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine
  },
  handle: {
    backgroundColor: "rgba(255,255,255,0.28)",
    width: 42
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: 10
  },
  eyebrow: {
    ...theme.typography.overline,
    color: theme.colors.gold
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textMuted
  },
  steps: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 8
  },
  stepPill: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine
  },
  stepPillActive: {
    borderColor: theme.colors.borderGold,
    backgroundColor: theme.colors.goldSoft
  },
  stepText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted
  },
  stepTextActive: {
    color: theme.colors.gold,
    fontWeight: "700"
  },
  panel: {
    gap: 10,
    marginTop: 4
  },
  label: {
    ...theme.typography.overline,
    color: theme.colors.gold
  },
  input: {
    color: theme.colors.textPrimary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    ...theme.typography.body
  },
  hint: {
    ...theme.typography.caption,
    color: theme.colors.textMuted
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine
  },
  chipActive: {
    borderColor: theme.colors.borderGold,
    backgroundColor: theme.colors.goldSoft
  },
  chipText: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary
  },
  navRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: theme.colors.gold,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    alignItems: "center"
  },
  primaryText: {
    ...theme.typography.bodyStrong,
    color: "#1A1408"
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderGold,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    alignItems: "center"
  },
  secondaryText: {
    ...theme.typography.bodyStrong,
    color: theme.colors.gold
  },
  error: {
    ...theme.typography.caption,
    color: theme.colors.danger
  }
});