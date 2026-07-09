import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import type { DiscoveryFilters } from "@stagebook/shared";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";
import { PressableScale } from "./PressableScale";
import { useSheetBackdrop, useSheetSnapHaptic } from "./sheetBackdrop";

export interface FiltersBottomSheetRef {
  open: () => void;
  close: () => void;
}

interface FiltersBottomSheetProps {
  filters: DiscoveryFilters;
  onChange: (patch: Partial<DiscoveryFilters>) => void;
  resultCount: number;
}

const genres = ["all", "Afro House", "Jazz", "Soul", "Live Band", "Classical"];

export const FiltersBottomSheet = forwardRef<FiltersBottomSheetRef, FiltersBottomSheetProps>(
  function FiltersBottomSheet({ filters, onChange, resultCount }, ref) {
    const sheetRef = useRef<BottomSheet>(null);
    const renderBackdrop = useSheetBackdrop();
    const onSnap = useSheetSnapHaptic();
    const snapPoints = useMemo(() => ["58%", "88%"], []);

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.snapToIndex(0),
      close: () => sheetRef.current?.close()
    }));

    return (
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onChange={onSnap}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handle}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Refine discovery</Text>
          <Text style={styles.subtitle}>{resultCount} artists match your filters</Text>

          <Text style={styles.label}>City</Text>
          <BottomSheetTextInput
            style={styles.input}
            value={filters.city}
            onChangeText={(city) => onChange({ city })}
            placeholderTextColor={theme.colors.textMuted}
          />

          <Text style={styles.label}>Search radius · {filters.radiusKm} km</Text>
          <View style={styles.chipRow}>
            {[25, 50, 100, 200].map((radiusKm) => (
              <PressableScale
                key={radiusKm}
                haptic="selection"
                style={[styles.chip, filters.radiusKm === radiusKm ? styles.chipActive : null]}
                onPress={() => onChange({ radiusKm })}
              >
                <Text style={styles.chipText}>{radiusKm} km</Text>
              </PressableScale>
            ))}
          </View>

          <Text style={styles.label}>Budget range (ZAR)</Text>
          <View style={styles.rangeRow}>
            <BottomSheetTextInput
              style={[styles.input, styles.rangeInput]}
              keyboardType="numeric"
              value={String(filters.minBudget)}
              onChangeText={(value) => onChange({ minBudget: Number(value) || 0 })}
              placeholderTextColor={theme.colors.textMuted}
            />
            <Text style={styles.rangeDash}>—</Text>
            <BottomSheetTextInput
              style={[styles.input, styles.rangeInput]}
              keyboardType="numeric"
              value={String(filters.maxBudget)}
              onChangeText={(value) => onChange({ maxBudget: Number(value) || 0 })}
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>

          <Text style={styles.label}>Genre</Text>
          <View style={styles.chipRow}>
            {genres.map((genre) => (
              <PressableScale
                key={genre}
                haptic="selection"
                style={[styles.chip, filters.genre === genre ? styles.chipActive : null]}
                onPress={() => onChange({ genre })}
              >
                <Text style={styles.chipText}>{genre}</Text>
              </PressableScale>
            ))}
          </View>

          <PressableScale style={styles.applyBtn} haptic="medium" onPress={() => sheetRef.current?.close()}>
            <Text style={styles.applyText}>Apply filters</Text>
          </PressableScale>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: theme.colors.obsidianRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine
  },
  handle: {
    backgroundColor: "rgba(255,255,255,0.28)",
    width: 42
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: 10
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    marginBottom: 8
  },
  label: {
    ...theme.typography.overline,
    color: theme.colors.gold,
    marginTop: 8
  },
  input: {
    color: theme.colors.textPrimary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    ...theme.typography.body
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine,
    backgroundColor: "rgba(255,255,255,0.03)"
  },
  chipActive: {
    borderColor: theme.colors.borderGold,
    backgroundColor: theme.colors.goldSoft
  },
  chipText: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  rangeInput: {
    flex: 1
  },
  rangeDash: {
    color: theme.colors.textMuted
  },
  applyBtn: {
    marginTop: 16,
    backgroundColor: theme.colors.gold,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    alignItems: "center"
  },
  applyText: {
    ...theme.typography.bodyStrong,
    color: "#1A1408"
  }
});