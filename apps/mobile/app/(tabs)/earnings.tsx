import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { formatZar } from "@stagebook/shared";
import { LuxuryCard } from "../../src/components/LuxuryCard";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

export default function EarningsScreen() {
  const {
    bookings,
    myArtistProfile,
    payoutBalances,
    payouts,
    loadArtistDashboard,
    requestPayout
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
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Earnings & Payouts</Text>
      <View style={styles.grid}>
        <LuxuryCard>
          <Text style={styles.label}>Gross from bookings</Text>
          <Text style={styles.value}>{formatZar(gross)}</Text>
        </LuxuryCard>
        <LuxuryCard>
          <Text style={styles.label}>Available balance</Text>
          <Text style={styles.value}>{formatZar(available)}</Text>
        </LuxuryCard>
        <LuxuryCard>
          <Text style={styles.label}>Pending escrow</Text>
          <Text style={styles.value}>{formatZar(pending)}</Text>
        </LuxuryCard>
        <LuxuryCard>
          <Text style={styles.label}>Platform fees (5%)</Text>
          <Text style={styles.value}>{formatZar(fees)}</Text>
        </LuxuryCard>
      </View>

      <LuxuryCard>
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
        <Pressable
          style={[styles.btn, !myArtistProfile || !amount ? styles.btnDisabled : null]}
          disabled={!myArtistProfile || !amount}
          onPress={() => void requestPayout(Number(amount))}
        >
          <Text style={styles.btnText}>Request payout</Text>
        </Pressable>
      </LuxuryCard>

      <LuxuryCard>
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
      </LuxuryCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, gap: 12, paddingTop: 56 },
  title: { color: theme.colors.textPrimary, fontSize: 28, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  label: { color: theme.colors.textMuted, fontSize: 12 },
  section: { color: theme.colors.textPrimary, fontWeight: "700", fontSize: 17, marginBottom: 8 },
  value: { color: theme.colors.gold, fontSize: 20, fontWeight: "700" },
  muted: { color: theme.colors.textMuted, lineHeight: 22 },
  input: {
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    marginVertical: 10
  },
  btn: {
    backgroundColor: theme.colors.gold,
    padding: 12,
    borderRadius: 999,
    alignItems: "center"
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#1a1408", fontWeight: "700" },
  row: { marginBottom: 10 }
});