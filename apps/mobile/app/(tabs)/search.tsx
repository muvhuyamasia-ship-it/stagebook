import { StyleSheet, Text, View } from "react-native";
import { BlurHeader } from "../../src/components/BlurHeader";
import { FloatingSurface } from "../../src/components/FloatingSurface";
import { PressableScale } from "../../src/components/PressableScale";
import { Skeleton } from "../../src/components/Skeleton";
import { useSheets } from "../../src/context/SheetContext";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

export default function SearchScreen() {
  const { filters, filteredArtists, dataLoading } = useStageBook();
  const { openFilters } = useSheets();

  return (
    <View style={styles.page}>
      <BlurHeader
        title="Search & Map"
        subtitle="Proximity-led discovery with live radius controls"
        rightSlot={
          <PressableScale style={styles.filterBtn} haptic="selection" onPress={openFilters}>
            <Text style={styles.filterBtnText}>Filters</Text>
          </PressableScale>
        }
      >
        <FloatingSurface>
          <Text style={styles.metric}>{filters.radiusKm} km radius</Text>
          <Text style={styles.muted}>
            Centered on {filters.city} · {filteredArtists.length} artists in range
          </Text>
          {dataLoading ? (
            <Skeleton height={180} borderRadius={theme.radius.lg} />
          ) : (
            <View style={styles.map}>
              <View style={styles.mapGrid} />
              <View style={styles.mapPulse} />
              <Text style={styles.mapLabel}>Live proximity map</Text>
              <Text style={styles.mapSub}>
                {filteredArtists.length} talent profiles within {filters.radiusKm} km
              </Text>
            </View>
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
  metric: {
    ...theme.typography.metric,
    color: theme.colors.textPrimary
  },
  muted: {
    ...theme.typography.body,
    color: theme.colors.textMuted
  },
  map: {
    height: 220,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine,
    backgroundColor: "#0A0D14",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 0,
    opacity: 0.25,
    backgroundColor: "transparent",
    borderColor: theme.colors.borderFine
  },
  mapPulse: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(203,168,72,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderGold
  },
  mapLabel: {
    ...theme.typography.headline,
    color: theme.colors.textPrimary
  },
  mapSub: {
    ...theme.typography.caption,
    color: theme.colors.textMuted
  }
});