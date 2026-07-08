import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { LuxuryCard } from "../src/components/LuxuryCard";
import { theme } from "../src/theme/theme";

export default function LandingScreen() {
  return (
    <LinearGradient colors={[...theme.gradients.app]} style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>StageBook</Text>
        <Text style={styles.title}>Luxury live bookings for elite talent.</Text>
        <Text style={styles.subtitle}>
          Verified identities, escrow payments, negotiation chat, and contract-grade workflows.
        </Text>
        <View style={styles.ctaRow}>
          <Link href="/login" style={styles.ctaPrimary}>
            <Text style={styles.ctaPrimaryText}>Sign in</Text>
          </Link>
          <Link href="/(tabs)/discover" style={styles.ctaSecondary}>
            <Text style={styles.ctaSecondaryText}>Browse (demo)</Text>
          </Link>
          <Link href="/(tabs)/profile" style={styles.ctaSecondary}>
            <Text style={styles.ctaSecondaryText}>Join as Artist</Text>
          </Link>
        </View>
        <LuxuryCard>
          <Text style={styles.cardTitle}>Trust layer</Text>
          <Text style={styles.cardCopy}>Biometric verification · 30% escrow deposit · 5% platform fee</Text>
        </LuxuryCard>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: 24, paddingTop: 72, gap: 16 },
  eyebrow: { color: theme.colors.gold, letterSpacing: 3, textTransform: "uppercase", fontSize: 12 },
  title: { color: theme.colors.textPrimary, fontSize: 34, fontWeight: "700", lineHeight: 40 },
  subtitle: { color: theme.colors.textMuted, fontSize: 16, lineHeight: 24 },
  ctaRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  ctaPrimary: {
    backgroundColor: theme.colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999
  },
  ctaPrimaryText: { color: "#1a1408", fontWeight: "700" },
  ctaSecondary: {
    borderWidth: 1,
    borderColor: theme.colors.borderGold,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999
  },
  ctaSecondaryText: { color: theme.colors.gold, fontWeight: "700" },
  cardTitle: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: "700" },
  cardCopy: { color: theme.colors.textMuted, lineHeight: 22 }
});