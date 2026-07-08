import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BOOKING_STATUS_LABEL } from "@stagebook/shared";
import { LuxuryCard } from "../../src/components/LuxuryCard";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

export default function MessageThreadScreen() {
  const { bookingId = "" } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
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
    markThreadRead
  } = useStageBook();

  const booking = getBooking(bookingId);
  const artist = booking ? getArtist(booking.artistProfileId) : undefined;
  const messages = getBookingChat(bookingId);
  const context = getBookingContext(bookingId);
  const pending = getPendingCounterOffer(bookingId);
  const [body, setBody] = useState("");
  const [counter, setCounter] = useState(booking?.quotedPriceZar ?? 0);

  useEffect(() => {
    markThreadRead(bookingId);
  }, [bookingId, messages.length, markThreadRead]);

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
        <Text style={styles.muted}>{booking.eventName} · {booking.eventDate}</Text>
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
        {messages.map((msg) => {
          const offer = msg.counterOfferId ? getCounterOffer(msg.counterOfferId) : undefined;
          const isCounter = msg.messageType === "counter_offer" || msg.systemAction === "counter_offer";
          return (
            <View
              key={msg.id}
              style={[styles.bubble, isCounter && styles.bubbleCounter]}
            >
              <Text style={styles.bubbleText}>{msg.body}</Text>
              {offer ? (
                <Text style={styles.offerMeta}>
                  {offer.proposedStartTime}–{offer.proposedEndTime}
                </Text>
              ) : null}
            </View>
          );
        })}
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="Type a secure message…"
          placeholderTextColor={theme.colors.textMuted}
        />
        <Pressable style={styles.btn} onPress={() => { sendMessage(bookingId, body); setBody(""); }}>
          <Text style={styles.btnText}>Send</Text>
        </Pressable>
      </LuxuryCard>

      <LuxuryCard>
        <Text style={styles.section}>Transaction hub</Text>
        <Text style={styles.muted}>Current: R{booking.quotedPriceZar.toLocaleString()}</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(counter)}
          onChangeText={(v) => setCounter(Number(v) || 0)}
        />
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
        <View style={styles.row}>
          <Pressable
            style={styles.btnOutline}
            onPress={() =>
              sendCounterOffer(bookingId, {
                priceZar: counter,
                startTime: booking.startTime,
                endTime: booking.endTime
              })
            }
          >
            <Text style={styles.btnOutlineText}>Issue counter</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={() => acceptOffer(bookingId)}>
            <Text style={styles.btnText}>Accept offer</Text>
          </Pressable>
        </View>
      </LuxuryCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, gap: 12, paddingTop: 56 },
  back: { color: theme.colors.gold, marginBottom: 8 },
  title: { color: theme.colors.textPrimary, fontSize: 24, fontWeight: "700" },
  muted: { color: theme.colors.textMuted },
  status: { color: theme.colors.warning, fontWeight: "700", marginTop: 6 },
  section: { color: theme.colors.gold, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" },
  contextRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  contextLabel: { color: theme.colors.textMuted, fontSize: 11 },
  contextValue: { color: theme.colors.textPrimary, fontWeight: "600" },
  bubble: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8
  },
  bubbleCounter: {
    borderColor: theme.colors.borderGold,
    backgroundColor: theme.colors.goldSoft
  },
  bubbleText: { color: theme.colors.textPrimary },
  offerMeta: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4 },
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
    marginTop: 8
  },
  btnText: { color: "#1a1408", fontWeight: "700" },
  btnOutline: {
    borderWidth: 1,
    borderColor: theme.colors.borderGold,
    padding: 12,
    borderRadius: 999,
    alignItems: "center"
  },
  btnOutlineText: { color: theme.colors.gold, fontWeight: "600" },
  row: { flexDirection: "row", gap: 8, marginTop: 8 }
});