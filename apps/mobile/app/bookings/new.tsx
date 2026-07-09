import { Link, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { STAGEBOOK_TIME_SLOTS } from "@stagebook/shared";
import { LuxuryCard } from "../../src/components/LuxuryCard";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

const durations = [1, 2, 3, 4] as const;

export default function BookingWizardScreen() {
  const { artist: artistParam } = useLocalSearchParams<{ artist?: string }>();
  const artistId = artistParam ?? "artist-1";
  const { getArtist, getCalendarState, createBooking } = useStageBook();
  const artist = getArtist(artistId);

  const [step, setStep] = useState(1);
  const [eventDate, setEventDate] = useState("2026-12-15");
  const [startTime, setStartTime] = useState("18:00");
  const [durationHours, setDurationHours] = useState(2);
  const [locationLabel, setLocationLabel] = useState("Sandton Convention Centre");
  const [quotedPrice, setQuotedPrice] = useState(artist?.basePriceZar ?? 18000);
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("Corporate");
  const [error, setError] = useState<string | null>(null);

  const endTime = useMemo(() => {
    const [h, m] = startTime.split(":").map(Number);
    return `${String(h + durationHours).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }, [startTime, durationHours]);

  const calState = eventDate ? getCalendarState(artistId, eventDate) : "available";

  async function submit() {
    setError(null);
    const result = await createBooking({
      artistId,
      eventDate,
      startTime,
      endTime,
      durationHours,
      locationLabel,
      latitude: -26.107,
      longitude: 28.054,
      quotedPriceZar: quotedPrice,
      eventName,
      eventType,
      specialRequests: "",
      technicalRider: "",
      guestCount: 150
    });
    if (!result.ok) {
      setError(result.error ?? "Unable to create booking");
      return;
    }
    router.replace(`/bookings/${result.bookingId}`);
  }

  if (!artist) {
    return (
      <ScrollView style={styles.page}>
        <Text style={styles.title}>Artist not found</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Link href={`/artists/${artistId}`} asChild>
        <Pressable>
          <Text style={styles.back}>← {artist.stageName}</Text>
        </Pressable>
      </Link>
      <LuxuryCard>
        <Text style={styles.title}>Book {artist.stageName}</Text>
        <Text style={styles.muted}>Step {step} of 4</Text>
        <View style={styles.steps}>
          {["Date", "Time", "Location", "Offer"].map((label, i) => (
            <Text
              key={label}
              style={[styles.step, step === i + 1 ? styles.stepActive : null]}
            >
              {label}
            </Text>
          ))}
        </View>
      </LuxuryCard>

      {step === 1 ? (
        <LuxuryCard>
          <Text style={styles.label}>Event date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={eventDate}
            onChangeText={setEventDate}
            placeholderTextColor={theme.colors.textMuted}
          />
          <Text style={styles.muted}>Calendar state: {calState}</Text>
          <Pressable style={styles.btn} onPress={() => setStep(2)}>
            <Text style={styles.btnText}>Next</Text>
          </Pressable>
        </LuxuryCard>
      ) : null}

      {step === 2 ? (
        <LuxuryCard>
          <Text style={styles.label}>Start time</Text>
          <View style={styles.slotRow}>
            {STAGEBOOK_TIME_SLOTS.slice(0, 8).map((slot) => (
              <Pressable
                key={slot}
                style={[styles.slot, startTime === slot ? styles.slotActive : null]}
                onPress={() => setStartTime(slot)}
              >
                <Text style={styles.slotText}>{slot}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Duration (hours)</Text>
          <View style={styles.slotRow}>
            {durations.map((d) => (
              <Pressable
                key={d}
                style={[styles.slot, durationHours === d ? styles.slotActive : null]}
                onPress={() => setDurationHours(d)}
              >
                <Text style={styles.slotText}>{d}h</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.muted}>Ends at {endTime}</Text>
          <View style={styles.navRow}>
            <Pressable style={styles.btnOutline} onPress={() => setStep(1)}>
              <Text style={styles.btnOutlineText}>Back</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={() => setStep(3)}>
              <Text style={styles.btnText}>Next</Text>
            </Pressable>
          </View>
        </LuxuryCard>
      ) : null}

      {step === 3 ? (
        <LuxuryCard>
          <Text style={styles.label}>Venue / location</Text>
          <TextInput
            style={styles.input}
            value={locationLabel}
            onChangeText={setLocationLabel}
            placeholderTextColor={theme.colors.textMuted}
          />
          <View style={styles.navRow}>
            <Pressable style={styles.btnOutline} onPress={() => setStep(2)}>
              <Text style={styles.btnOutlineText}>Back</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={() => setStep(4)}>
              <Text style={styles.btnText}>Next</Text>
            </Pressable>
          </View>
        </LuxuryCard>
      ) : null}

      {step === 4 ? (
        <LuxuryCard>
          <Text style={styles.label}>Event name</Text>
          <TextInput
            style={styles.input}
            value={eventName}
            onChangeText={setEventName}
            placeholder="Annual gala"
            placeholderTextColor={theme.colors.textMuted}
          />
          <Text style={styles.label}>Event type</Text>
          <TextInput
            style={styles.input}
            value={eventType}
            onChangeText={setEventType}
            placeholderTextColor={theme.colors.textMuted}
          />
          <Text style={styles.label}>Offer (ZAR)</Text>
          <TextInput
            style={styles.input}
            value={String(quotedPrice)}
            onChangeText={(v) => setQuotedPrice(Number(v) || 0)}
            keyboardType="numeric"
            placeholderTextColor={theme.colors.textMuted}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.navRow}>
            <Pressable style={styles.btnOutline} onPress={() => setStep(3)}>
              <Text style={styles.btnOutlineText}>Back</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={() => void submit()}>
              <Text style={styles.btnText}>Send request</Text>
            </Pressable>
          </View>
        </LuxuryCard>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, gap: 12, paddingTop: 56 },
  back: { color: theme.colors.gold, marginBottom: 8 },
  title: { color: theme.colors.textPrimary, fontSize: 24, fontWeight: "700" },
  muted: { color: theme.colors.textMuted, marginTop: 4 },
  label: { color: theme.colors.gold, fontSize: 12, textTransform: "uppercase", marginBottom: 6 },
  input: {
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  steps: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  step: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textMuted,
    fontSize: 12
  },
  stepActive: {
    borderColor: theme.colors.borderGold,
    backgroundColor: "rgba(203,168,72,0.15)",
    color: theme.colors.gold
  },
  slotRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  slot: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  slotActive: { borderColor: theme.colors.borderGold, backgroundColor: "rgba(203,168,72,0.15)" },
  slotText: { color: theme.colors.textPrimary, fontSize: 13 },
  navRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  btn: {
    flex: 1,
    backgroundColor: theme.colors.gold,
    padding: 12,
    borderRadius: 999,
    alignItems: "center"
  },
  btnText: { color: "#1a1408", fontWeight: "700" },
  btnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.borderGold,
    padding: 12,
    borderRadius: 999,
    alignItems: "center"
  },
  btnOutlineText: { color: theme.colors.gold, fontWeight: "600" },
  error: { color: theme.colors.danger, marginBottom: 8 }
});