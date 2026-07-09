import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { formatZar } from "@stagebook/shared";
import { BlurHeader } from "../../src/components/BlurHeader";
import { FloatingSurface } from "../../src/components/FloatingSurface";
import { PressableScale } from "../../src/components/PressableScale";
import { Skeleton } from "../../src/components/Skeleton";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

export default function EarningsScreen() {
  const {
    bookings,
    myArtistProfile,
    payoutBalances,
    payouts,
    loadArtistDashboard,
    requestPayout,
    dataLoading
  } = useStageBook();
  const [amount, setAmount] = useState("");

  useEffect(() => {
    void loadArtistDashboard();
  }, [loadArtistDashboard]);

  const confirmed = bookings.filter((b) =>
    ["confirmed", "completed", "paid"].includes(b.status)
  );
  const gross = confirmed.reduce((sum, b) => sum + b.quotedPriceZar, 0);
  const fees = Math.round(gross * 0.05);
  const available = payoutBalances?.availableBalanceZar ?? 0;
  const pending = payoutBalances?.pendingBalanceZar ?? 0;

  return (
    <View style={styles.page}>
      <BlurHeader title="Earnings" subtitle="Balances, payouts, and platform fees">
        {dataLoading && !payoutBalances ? (
          <>
            <Skeleton height={100} borderRadius={theme.radius.lg} />
            <Skeleton height={100} borderRadius={theme.radius.lg} />
          </>
        ) : (
          <View style={styles.grid}>
            <FloatingSurface style={styles.metricCard}>
              <Text style={styles.label}>Gross from bookings</Text>
              <Text style={styles.value}>{formatZar(gross)}</Text>
            </FloatingSurface>
            <FloatingSurface style={styles.metricCard}>
              <Text style={styles.label}>Available balance</Text>
              <Text style={styles.value}>{formatZar(available)}</Text>
            </FloatingSurface>
            <FloatingSurface style={styles.metricCard}>
              <Text style={styles.label}>Pending escrow</Text>
              <Text style={styles.value}>{formatZar(pending)}</Text>
            </FloatingSurface>
            <FloatingSurface style={styles.metricCard}>
              <Text style={styles.label}>Platform fees (5%)</Text>
              <Text style={styles.value}>{formatZar(fees)}</Text>
            </FloatingSurface>
          </View>
        )}

        <FloatingSurface>
          <Text style={styles.section}>Request payout</Text>
          <Text style={styles.muted}>
            {myArtistProfile
              ? `Artist: ${myArtistProfile.stageName}`
              : "Sign in as an artist to request payouts."}
          </Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder={String(available || 0)}
            placeholderTextColor={theme.colors.textMuted}
          />
          <PressableScale
            style={[styles.btn, !myArtistProfile || !amount ? styles.btnDisabled : null]}
            haptic="medium"
            disabled={!myArtistProfile || !amount}
            onPress={() => void requestPayout(Number(amount))}
          >
            <Text style={styles.btnText}>Request payout</Text>
          </PressableScale>
        </FloatingSurface>

        <FloatingSurface>
          <Text style={styles.section}>Payout history</Text>
          {payouts.length === 0 ? (
            <Text style={styles.muted}>No payout requests yet.</Text>
          ) : (
            payouts.map((payout) => (
              <View key={payout.id} style={styles.row}>
                <Text style={styles.value}>{formatZar(payout.amountZar)}</Text>
                <Text style={styles.muted}>{payout.status}</Text>
              </View>
            ))
          )}
        </FloatingSurface>
      </BlurHeader>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.obsidian
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  metricCard: {
    width: "48%",
    flexGrow: 1
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textMuted
  },
  section: {
    ...theme.typography.overline,
    color: theme.colors.gold
  },
  value: {
    ...theme.typography.metric,
    color: theme.colors.gold
  },
  muted: {
    ...theme.typography.body,
    color: theme.colors.textMuted
  },
  input: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine,
    borderRadius: theme.radius.md,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.03)"
  },
  btn: {
    backgroundColor: theme.colors.gold,
    paddingVertical: 14,
    borderRadius: theme.radius.pill,
    alignItems: "center"
  },
  btnDisabled: {
    opacity: 0.5
  },
  btnText: {
    ...theme.typography.body,
    color: "#1a1408",
    fontWeight: "700"
  },
  row: {
    marginBottom: 10
  }
});