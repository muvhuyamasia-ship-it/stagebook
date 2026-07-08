import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme/theme";

export function LuxuryCard({ children }: { children: ReactNode }) {
  return (
    <LinearGradient colors={[...theme.gradients.card]} style={styles.card}>
      <View style={styles.inner}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  inner: {
    padding: 18,
    gap: 12
  }
});