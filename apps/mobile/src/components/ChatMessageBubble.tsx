import { StyleSheet, Text, View } from "react-native";
import type { ChatMessage, CounterOffer } from "@stagebook/shared";
import { formatZar } from "@stagebook/shared";
import { theme } from "../theme/theme";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  counterOffer?: CounterOffer;
  isOwn: boolean;
}

export function ChatMessageBubble({ message, counterOffer, isOwn }: ChatMessageBubbleProps) {
  if (message.messageType === "counter_offer" || message.systemAction === "counter_offer") {
    return (
      <View style={[styles.tile, styles.tileCounter]}>
        <Text style={styles.eyebrow}>Counter-offer issued</Text>
        <Text style={styles.title}>
          {counterOffer ? formatZar(counterOffer.proposedPriceZar) : message.body}
        </Text>
        {counterOffer ? (
          <Text style={styles.meta}>
            {counterOffer.proposedStartTime}–{counterOffer.proposedEndTime}
            {counterOffer.note ? ` · ${counterOffer.note}` : ""}
          </Text>
        ) : null}
      </View>
    );
  }

  if (message.systemAction === "accept") {
    return (
      <View style={[styles.tile, styles.tileSuccess]}>
        <Text style={styles.eyebrow}>Offer accepted</Text>
        <Text style={styles.body}>{message.body}</Text>
      </View>
    );
  }

  if (message.systemAction === "decline") {
    return (
      <View style={[styles.tile, styles.tileDanger]}>
        <Text style={styles.eyebrow}>Offer declined</Text>
        <Text style={styles.body}>{message.body}</Text>
      </View>
    );
  }

  if (message.systemAction === "payment") {
    return (
      <View style={[styles.tile, styles.tileSuccess]}>
        <Text style={styles.eyebrow}>Payment milestone</Text>
        <Text style={styles.body}>{message.body}</Text>
      </View>
    );
  }

  if (message.systemAction === "contract") {
    return (
      <View style={[styles.tile, styles.tileNotify]}>
        <Text style={styles.eyebrow}>Contract update</Text>
        <Text style={styles.body}>{message.body}</Text>
      </View>
    );
  }

  if (message.messageType === "notification_tile" || message.systemAction === "notification") {
    return (
      <View style={[styles.tile, styles.tileNotify]}>
        <Text style={styles.eyebrow}>System update</Text>
        <Text style={styles.body}>{message.body}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      <View style={[styles.bubble, isOwn && styles.bubbleOwn]}>
        <Text style={styles.body}>{message.body}</Text>
        <Text style={styles.time}>{new Date(message.createdAt).toLocaleString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "flex-start", marginBottom: 8 },
  rowOwn: { alignItems: "flex-end" },
  bubble: {
    maxWidth: "88%",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface
  },
  bubbleOwn: { borderColor: theme.colors.borderGold, backgroundColor: theme.colors.goldSoft },
  body: { color: theme.colors.textPrimary },
  time: { color: theme.colors.textMuted, fontSize: 11, marginTop: 4 },
  tile: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  tileCounter: { borderColor: theme.colors.borderGold, backgroundColor: theme.colors.goldSoft },
  tileSuccess: { borderColor: theme.colors.success, backgroundColor: "rgba(34,197,94,0.08)" },
  tileDanger: { borderColor: theme.colors.danger, backgroundColor: "rgba(239,68,68,0.08)" },
  tileNotify: { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  eyebrow: { color: theme.colors.gold, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  title: { color: theme.colors.textPrimary, fontWeight: "700", fontSize: 18, marginTop: 4 },
  meta: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4 }
});