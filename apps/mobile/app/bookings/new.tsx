import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "../../src/components/Skeleton";
import { useSheets } from "../../src/context/SheetContext";
import { theme } from "../../src/theme/theme";

export default function BookingWizardRedirect() {
  const { artist: artistParam, step: stepParam, submit: submitParam } = useLocalSearchParams<{
    artist?: string;
    step?: string;
    submit?: string;
  }>();
  const { openBookingWizard } = useSheets();
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;

    const artistId = artistParam ?? "";
    const step = stepParam ? Number(stepParam) : undefined;
    const submit = submitParam === "1" || submitParam === "true";

    openBookingWizard(artistId, { step, submit });

    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/discover");
  }, [artistParam, stepParam, submitParam, openBookingWizard]);

  return (
    <View style={styles.page}>
      <Skeleton height={48} borderRadius={theme.radius.pill} />
      <Skeleton height={220} borderRadius={theme.radius.lg} />
      <Skeleton height={160} borderRadius={theme.radius.lg} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.obsidian,
    padding: theme.spacing.lg,
    paddingTop: 72,
    gap: theme.spacing.md
  }
});