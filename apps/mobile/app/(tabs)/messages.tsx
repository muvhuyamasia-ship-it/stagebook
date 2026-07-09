import { useMemo, useState } from "react";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import type { MessageThreadFilter } from "@stagebook/shared";
import { BlurHeader } from "../../src/components/BlurHeader";
import { FloatingSurface } from "../../src/components/FloatingSurface";
import { PressableScale } from "../../src/components/PressableScale";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

const filters: MessageThreadFilter[] = ["all", "negotiating", "unread"];

export default function MessagesScreen() {
  const { getMessageThreads, unreadMessageCount } = useStageBook();
  const [filter, setFilter] = useState<MessageThreadFilter>("all");
  const threads = useMemo(() => getMessageThreads(filter), [getMessageThreads, filter]);

  return (
    <View style={styles.page}>
      <BlurHeader
        title="Messages"
        subtitle={
          unreadMessageCount > 0 ? `${unreadMessageCount} unread conversations` : "Negotiation inbox"
        }
      >
        <View style={styles.filters}>
          {filters.map((f) => (
            <PressableScale
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              haptic="selection"
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </PressableScale>
          ))}
        </View>

        {threads.map((thread) => (
          <Link key={thread.bookingId} href={`/messages/${thread.bookingId}`} asChild>
            <PressableScale haptic="selection">
              <FloatingSurface>
                <View style={styles.row}>
                  <Text style={styles.name}>{thread.artistName}</Text>
                  {thread.unreadCount > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unread}>{thread.unreadCount}</Text>
                    </View>
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
              </FloatingSurface>
            </PressableScale>
          </Link>
        ))}
      </BlurHeader>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.obsidian
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine,
    backgroundColor: "rgba(255,255,255,0.03)"
  },
  filterChipActive: {
    borderColor: theme.colors.borderGold,
    backgroundColor: theme.colors.goldSoft
  },
  filterText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: "capitalize"
  },
  filterTextActive: {
    color: theme.colors.gold,
    fontWeight: "700"
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  name: {
    ...theme.typography.headline,
    color: theme.colors.textPrimary
  },
  unreadBadge: {
    backgroundColor: theme.colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.pill
  },
  unread: {
    ...theme.typography.caption,
    color: "#1a1408",
    fontWeight: "700"
  },
  event: {
    ...theme.typography.caption,
    color: theme.colors.textMuted
  },
  preview: {
    ...theme.typography.body,
    color: theme.colors.textMuted
  },
  meta: {
    flexDirection: "row",
    gap: 10
  },
  status: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    fontWeight: "600"
  },
  counter: {
    ...theme.typography.caption,
    color: theme.colors.warning
  }
});