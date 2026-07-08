import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LuxuryCard } from "../../src/components/LuxuryCard";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

export default function SearchScreen() {
  const { filters, setFilters, filteredArtists } = useStageBook();

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Search & Map</Text>
      <LuxuryCard>
        <Text style={styles.label}>Radius: {filters.radiusKm} km</Text>
        <View style={styles.map}>
          <Text style={styles.muted}>Map proximity view — {filters.city}</Text>
        </View>
        <Text style={styles.muted}>{filteredArtists.length} artists in range</Text>
      </LuxuryCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, gap: 12, paddingTop: 56 },
  title: { color: theme.colors.textPrimary, fontSize: 28, fontWeight: "700" },
  label: { color: theme.colors.textPrimary, fontWeight: "600" },
  map: {
    height: 160,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f0f0f"
  },
  muted: { color: theme.colors.textMuted }
});