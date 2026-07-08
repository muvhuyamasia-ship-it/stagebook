import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AVAILABILITY_LABEL, formatZar } from "@stagebook/shared";
import { LuxuryCard } from "../../src/components/LuxuryCard";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

export default function DiscoverScreen() {
  const { filteredArtists, filters, setFilters } = useStageBook();

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Discover</Text>
      <LuxuryCard>
        <TextInput
          style={styles.input}
          placeholder="Search artists, genres…"
          placeholderTextColor={theme.colors.textMuted}
          value={filters.query}
          onChangeText={(query) => setFilters({ query })}
        />
      </LuxuryCard>
      {filteredArtists.map((artist) => (
        <LuxuryCard key={artist.id}>
          <View style={styles.row}>
            <View style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{artist.stageName}</Text>
              <Text style={styles.muted}>{artist.city}</Text>
            </View>
            <Text style={styles.status}>{AVAILABILITY_LABEL[artist.availabilityStatus]}</Text>
          </View>
          <Text style={styles.gold}>⭐ {artist.rating} · From {formatZar(artist.basePriceZar)}</Text>
        </LuxuryCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, gap: 12, paddingTop: 56 },
  title: { color: theme.colors.textPrimary, fontSize: 28, fontWeight: "700" },
  input: {
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(203,168,72,0.18)" },
  name: { color: theme.colors.textPrimary, fontWeight: "700", fontSize: 17 },
  muted: { color: theme.colors.textMuted, fontSize: 13 },
  status: { color: theme.colors.success, fontSize: 11, fontWeight: "700" },
  gold: { color: theme.colors.gold, fontWeight: "600" }
});