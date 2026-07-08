import { useMemo, useState } from "react";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { MessageThreadFilter } from "@stagebook/shared";
import { LuxuryCard } from "../../src/components/LuxuryCard";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

const filters: MessageThreadFilter[] = ["all", "negotiating", "unread"];

export default function MessagesScreen() {
  const { getMessageThreads, unreadMessageCount } = useStageBook();
  const [filter, setFilter] = useState<MessageThreadFilter>("all");
  const threads = useMemo(() => getMessageThreads(filter), [getMessageThreads, filter]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        {unreadMessageCount > 0 ? (
          <Text style={styles.badge}>{unreadMessageCount} unread</Text>
        ) : null}
      </View>

      <View style={styles.filters}>
        {filters.map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={styles.filterText}>{f}</Text>
          </Pressable>
        ))}
      </View>

      {threads.map((thread) => (
        <Link key={thread.bookingId} href={`/messages/${thread.bookingId}`} asChild>
          <Pressable>
            <LuxuryCard>
              <View style={styles.row}>
                <Text style={styles.name}>{thread.artistName}</Text>
                {thread.unreadCount > 0 ? (
                  <Text style={styles.unread}>{thread.unreadCount}</Text>
                ) : null}
              </View>
              <Text style={styles.event}>{thread.eventName}</Text>
              <Text style={styles.preview} numberOfLines={2}>
                {thread.lastMessage?.body ?? "No messages yet"}
              </Text>
              <View style={styles.meta}>
                <Text style={styles.status}>🟡 {thread.statusLabel}</Text>
                {thread.hasPendingCounter ? (
                  <Text style={styles.counter}>Counter pending</Text>
                ) : null}
              </View>
            </LuxuryCard>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, gap: 12, paddingTop: 56 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: theme.colors.textPrimary, fontSize: 28, fontWeight: "700" },
  badge: { color: theme.colors.gold, fontWeight: "700" },
  filters: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  filterChipActive: {
    borderColor: theme.colors.borderGold,
    backgroundColor: theme.colors.goldSoft
  },
  filterText: { color: theme.colors.textPrimary, fontSize: 12, textTransform: "capitalize" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { color: theme.colors.textPrimary, fontWeight: "700", fontSize: 17 },
  unread: {
    backgroundColor: theme.colors.gold,
    color: "#1a1408",
    fontWeight: "700",
    paddingHorizontal: 8,
    borderRadius: 999,
    fontSize: 11
  },
  event: { color: theme.colors.textMuted, fontSize: 13 },
  preview: { color: theme.colors.textMuted, marginTop: 6 },
  meta: { flexDirection: "row", gap: 10, marginTop: 8 },
  status: { color: theme.colors.warning, fontSize: 12, fontWeight: "600" },
  counter: { color: theme.colors.warning, fontSize: 11 }
});