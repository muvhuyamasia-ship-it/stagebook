import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BOOKING_STATUS_LABEL, STAGEBOOK_TIME_SLOTS } from "@stagebook/shared";
import { LuxuryCard } from "../../src/components/LuxuryCard";
import { ChatMessageBubble } from "../../src/components/ChatMessageBubble";
import { useAuth } from "../../src/context/AuthContext";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

export default function MessageThreadScreen() {
  const { bookingId = "" } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const {
    getBooking,
    getArtist,
    getBookingChat,
    getBookingContext,
    getPendingCounterOffer,
    getCounterOffer,
    sendMessage,
    sendCounterOffer,
    acceptCounterOffer,
    declineCounterOffer,
    acceptOffer,
    declineOffer,
    markThreadRead,
    refreshThread
  } = useStageBook();

  const booking = getBooking(bookingId);
  const artist = booking ? getArtist(booking.artistProfileId) : undefined;
  const messages = getBookingChat(bookingId);
  const context = getBookingContext(bookingId);
  const pending = getPendingCounterOffer(bookingId);
  const [body, setBody] = useState("");
  const [counterPrice, setCounterPrice] = useState(String(booking?.quotedPriceZar ?? 0));
  const [counterStart, setCounterStart] = useState(booking?.startTime ?? "18:00");
  const [counterEnd, setCounterEnd] = useState(booking?.endTime ?? "20:00");
  const [counterNote, setCounterNote] = useState("");

  useEffect(() => {
    markThreadRead(bookingId);
  }, [bookingId, messages.length, markThreadRead]);

  useEffect(() => {
    void refreshThread(bookingId);
    const timer = setInterval(() => {
      void refreshThread(bookingId);
    }, 5000);
    return () => clearInterval(timer);
  }, [bookingId, refreshThread]);

  useEffect(() => {
    if (booking) {
      setCounterPrice(String(booking.quotedPriceZar));
      setCounterStart(booking.startTime);
      setCounterEnd(booking.endTime);
    }
  }, [booking]);

  if (!booking) {
    return (
      <View style={styles.page}>
        <Text style={styles.title}>Thread not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back to inbox</Text>
      </Pressable>

      <LuxuryCard>
        <Text style={styles.title}>{artist?.stageName}</Text>
        <Text style={styles.muted}>
          {booking.eventName} · {booking.eventDate}
        </Text>
        <Text style={styles.status}>🟡 {BOOKING_STATUS_LABEL[booking.status]}</Text>
      </LuxuryCard>

      <LuxuryCard>
        <Text style={styles.section}>Booking context</Text>
        {context.map((item) => (
          <View key={item.id} style={styles.contextRow}>
            <Text style={styles.contextLabel}>{item.label}</Text>
            <Text style={styles.contextValue}>{item.value}</Text>
          </View>
        ))}
      </LuxuryCard>

      <LuxuryCard>
        <Text style={styles.section}>Negotiation thread</Text>
        {messages.map((msg) => (
          <ChatMessageBubble
            key={msg.id}
            message={msg}
            counterOffer={msg.counterOfferId ? getCounterOffer(msg.counterOfferId) : undefined}
            isOwn={msg.senderUserId === session?.user.id}
          />
        ))}
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="Type a secure message…"
          placeholderTextColor={theme.colors.textMuted}
        />
        <Pressable
          style={styles.btn}
          onPress={() => {
            if (!body.trim()) return;
            void sendMessage(bookingId, body.trim());
            setBody("");
          }}
        >
          <Text style={styles.btnText}>Send</Text>
        </Pressable>
      </LuxuryCard>

      <LuxuryCard>
        <Text style={styles.section}>Transaction hub</Text>
        <Text style={styles.muted}>Current: R{booking.quotedPriceZar.toLocaleString("en-ZA")}</Text>
        <Text style={styles.muted}>
          {booking.startTime} – {booking.endTime}
        </Text>

        {pending ? (
          <View style={styles.row}>
            <Pressable style={styles.btn} onPress={() => acceptCounterOffer(pending.id)}>
              <Text style={styles.btnText}>Accept counter</Text>
            </Pressable>
            <Pressable style={styles.btnOutline} onPress={() => declineCounterOffer(pending.id)}>
              <Text style={styles.btnOutlineText}>Decline</Text>
            </Pressable>
          </View>
        ) : null}

        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={counterPrice}
          onChangeText={setCounterPrice}
          placeholder="Counter amount (ZAR)"
          placeholderTextColor={theme.colors.textMuted}
        />
        <View style={styles.slotRow}>
          <Text style={styles.slotLabel}>Start</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {STAGEBOOK_TIME_SLOTS.map((slot) => (
              <Pressable
                key={`start-${slot}`}
                style={[styles.chip, counterStart === slot && styles.chipActive]}
                onPress={() => setCounterStart(slot)}
              >
                <Text style={styles.chipText}>{slot}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        <View style={styles.slotRow}>
          <Text style={styles.slotLabel}>End</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {STAGEBOOK_TIME_SLOTS.map((slot) => (
              <Pressable
                key={`end-${slot}`}
                style={[styles.chip, counterEnd === slot && styles.chipActive]}
                onPress={() => setCounterEnd(slot)}
              >
                <Text style={styles.chipText}>{slot}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        <TextInput
          style={styles.input}
          value={counterNote}
          onChangeText={setCounterNote}
          placeholder="Counter note (optional)"
          placeholderTextColor={theme.colors.textMuted}
        />
        <View style={styles.row}>
          <Pressable
            style={styles.btnOutline}
            onPress={() =>
              sendCounterOffer(bookingId, {
                priceZar: Number(counterPrice) || 0,
                startTime: counterStart,
                endTime: counterEnd,
                note: counterNote || undefined
              })
            }
          >
            <Text style={styles.btnOutlineText}>Issue counter</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={() => acceptOffer(bookingId)}>
            <Text style={styles.btnText}>Accept offer</Text>
          </Pressable>
        </View>
        <Pressable style={styles.btnGhost} onPress={() => declineOffer(bookingId)}>
          <Text style={styles.btnGhostText}>Decline offer</Text>
        </Pressable>
      </LuxuryCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, gap: 12, paddingBottom: 40, paddingTop: 56 },
  back: { color: theme.colors.gold, marginBottom: 8 },
  title: { color: theme.colors.textPrimary, fontSize: 24, fontWeight: "700" },
  muted: { color: theme.colors.textMuted, marginTop: 4 },
  status: { color: theme.colors.warning, fontWeight: "700", marginTop: 6 },
  section: { color: theme.colors.gold, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" },
  contextRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  contextLabel: { color: theme.colors.textMuted, fontSize: 11 },
  contextValue: { color: theme.colors.textPrimary, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    padding: 10,
    color: theme.colors.textPrimary,
    marginTop: 8
  },
  btn: {
    backgroundColor: theme.colors.gold,
    padding: 12,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 8,
    flex: 1
  },
  btnText: { color: "#1a1408", fontWeight: "700" },
  btnOutline: {
    borderWidth: 1,
    borderColor: theme.colors.borderGold,
    padding: 12,
    borderRadius: 999,
    alignItems: "center",
    flex: 1
  },
  btnOutlineText: { color: theme.colors.gold, fontWeight: "600" },
  btnGhost: { alignItems: "center", marginTop: 8 },
  btnGhostText: { color: theme.colors.textMuted },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  slotRow: { marginTop: 8, gap: 6 },
  slotLabel: { color: theme.colors.textMuted, fontSize: 12 },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8
  },
  chipActive: { borderColor: theme.colors.gold, backgroundColor: theme.colors.goldSoft },
  chipText: { color: theme.colors.textPrimary, fontSize: 12 }
});