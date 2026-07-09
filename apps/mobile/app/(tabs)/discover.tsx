import { router } from "expo-router";
import { useRef } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { ArtistDiscoveryCard } from "../../src/components/ArtistDiscoveryCard";
import { BlurHeader } from "../../src/components/BlurHeader";
import { FloatingSurface } from "../../src/components/FloatingSurface";
import { PressableScale } from "../../src/components/PressableScale";
import { ArtistCardSkeleton } from "../../src/components/Skeleton";
import { useSheets } from "../../src/context/SheetContext";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

export default function DiscoverScreen() {
  const { filteredArtists, filters, setFilters, dataLoading } = useStageBook();
  const { openFilters } = useSheets();
  const searchRef = useRef<TextInput>(null);

  return (
    <View style={styles.page}>
      <BlurHeader
        title="Discover"
        subtitle="Curated talent for premium live experiences"
        rightSlot={
          <PressableScale style={styles.filterBtn} haptic="selection" onPress={openFilters}>
            <Text style={styles.filterBtnText}>Filters</Text>
          </PressableScale>
        }
      >
        <FloatingSurface>
          <Text style={styles.searchLabel}>Search</Text>
          <TextInput
            ref={searchRef}
            style={styles.input}
            placeholder="Artists, genres, cities…"
            placeholderTextColor={theme.colors.textMuted}
            value={filters.query}
            onChangeText={(query) => setFilters({ query })}
          />
        </FloatingSurface>

        {dataLoading
          ? Array.from({ length: 3 }).map((_, index) => <ArtistCardSkeleton key={index} />)
          : filteredArtists.map((artist) => (
              <ArtistDiscoveryCard
                key={artist.id}
                artist={artist}
                onPress={() => router.push(`/artists/${artist.id}`)}
              />
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
  filterBtn: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine,
    backgroundColor: "rgba(255,255,255,0.05)"
  },
  filterBtnText: {
    ...theme.typography.caption,
    color: theme.colors.gold,
    fontWeight: "700"
  },
  searchLabel: {
    ...theme.typography.overline,
    color: theme.colors.gold
  },
  input: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.03)"
  }
});