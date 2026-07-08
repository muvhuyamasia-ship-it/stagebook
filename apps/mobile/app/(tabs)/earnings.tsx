import { ScrollView, StyleSheet, Text, View } from "react-native";
import { formatZar } from "@stagebook/shared";
import { LuxuryCard } from "../../src/components/LuxuryCard";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

export default function EarningsScreen() {
  const { bookings } = useStageBook();
  const gross = bookings.reduce((s, b) => s + b.quotedPriceZar, 0);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Earnings & Payouts</Text>
      <View style={styles.grid}>
        <LuxuryCard>
          <Text style={styles.label}>Gross earnings</Text>
          <Text style={styles.value}>{formatZar(gross || 248000)}</Text>
        </LuxuryCard>
        <LuxuryCard>
          <Text style={styles.label}>Platform fees</Text>
          <Text style={styles.value}>{formatZar(Math.round((gross || 248000) * 0.05))}</Text>
        </LuxuryCard>
      </View>
      <LuxuryCard>
        <Text style={styles.label}>Monthly trend</Text>
        <View style={styles.chart}>
          {[40, 55, 48, 70, 62, 80].map((h, i) => (
            <View key={i} style={[styles.bar, { height: h }]} />
          ))}
        </View>
      </LuxuryCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, gap: 12, paddingTop: 56 },
  title: { color: theme.colors.textPrimary, fontSize: 28, fontWeight: "700" },
  grid: { flexDirection: "row", gap: 10 },
  label: { color: theme.colors.textMuted, fontSize: 12 },
  value: { color: theme.colors.gold, fontSize: 22, fontWeight: "700" },
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 8, height: 100 },
  bar: { flex: 1, backgroundColor: theme.colors.gold, borderRadius: 6 }
});