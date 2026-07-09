import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FloatingSurface } from "../src/components/FloatingSurface";
import { PressableScale } from "../src/components/PressableScale";
import { theme } from "../src/theme/theme";

export default function LandingScreen() {
  return (
    <LinearGradient colors={[...theme.gradients.app]} style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>StageBook</Text>
        <Text style={styles.title}>Luxury live bookings for elite talent.</Text>
        <Text style={styles.subtitle}>
          Verified identities, escrow payments, negotiation chat, and contract-grade workflows.
        </Text>

        <View style={styles.ctaRow}>
          <Link href="/login" asChild>
            <PressableScale style={styles.ctaPrimary} haptic="medium">
              <Text style={styles.ctaPrimaryText}>Sign in</Text>
            </PressableScale>
          </Link>
          <Link href="/(tabs)/discover" asChild>
            <PressableScale style={styles.ctaSecondary} haptic="selection">
              <Text style={styles.ctaSecondaryText}>Browse (demo)</Text>
            </PressableScale>
          </Link>
          <Link href="/(tabs)/profile" asChild>
            <PressableScale style={styles.ctaSecondary} haptic="selection">
              <Text style={styles.ctaSecondaryText}>Join as Artist</Text>
            </PressableScale>
          </Link>
        </View>

        <FloatingSurface>
          <Text style={styles.cardTitle}>Trust layer</Text>
          <Text style={styles.cardCopy}>
            Biometric verification · 30% escrow deposit · 5% platform fee
          </Text>
        </FloatingSurface>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: 72,
    gap: theme.spacing.md
  },
  eyebrow: {
    ...theme.typography.overline,
    color: theme.colors.gold
  },
  title: {
    ...theme.typography.display,
    color: theme.colors.textPrimary
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textMuted
  },
  ctaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  ctaPrimary: {
    backgroundColor: theme.colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: theme.radius.pill
  },
  ctaPrimaryText: {
    ...theme.typography.body,
    color: "#1a1408",
    fontWeight: "700"
  },
  ctaSecondary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderGold,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: theme.radius.pill
  },
  ctaSecondaryText: {
    ...theme.typography.body,
    color: theme.colors.gold,
    fontWeight: "700"
  },
  cardTitle: {
    ...theme.typography.headline,
    color: theme.colors.textPrimary
  },
  cardCopy: {
    ...theme.typography.body,
    color: theme.colors.textMuted
  }
});