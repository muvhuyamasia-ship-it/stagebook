import { useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from "react-native-reanimated";
import { theme } from "../theme/theme";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = theme.radius.sm,
  style
}: SkeletonProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, [progress]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [-120, 220])
      }
    ],
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.35, 0.9, 0.35])
  }));

  return (
    <View style={[styles.base, { width, height, borderRadius }, style]}>
      <Animated.View style={[styles.shimmer, shimmerStyle]} />
    </View>
  );
}

export function ArtistCardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <Skeleton height={220} borderRadius={theme.radius.lg} />
      <View style={styles.cardSkeletonBody}>
        <Skeleton width="62%" height={18} />
        <Skeleton width="40%" height={14} />
        <View style={styles.cardSkeletonRow}>
          <Skeleton width={72} height={28} borderRadius={theme.radius.pill} />
          <Skeleton width={96} height={28} borderRadius={theme.radius.pill} />
        </View>
      </View>
    </View>
  );
}

export function ArtistProfileSkeleton() {
  return (
    <View style={styles.profileSkeleton}>
      <Skeleton height={280} borderRadius={theme.radius.xl} />
      <View style={styles.profileBlock}>
        <Skeleton width="55%" height={22} />
        <Skeleton width="38%" height={14} />
        <Skeleton height={44} borderRadius={theme.radius.pill} />
      </View>
      <View style={styles.profileBlock}>
        <Skeleton width="30%" height={14} />
        <Skeleton height={60} />
        <View style={styles.cardSkeletonRow}>
          <Skeleton width={64} height={28} borderRadius={theme.radius.pill} />
          <Skeleton width={80} height={28} borderRadius={theme.radius.pill} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "rgba(255,255,255,0.04)",
    overflow: "hidden"
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: "rgba(255,255,255,0.12)"
  },
  cardSkeleton: {
    gap: theme.spacing.sm
  },
  cardSkeletonBody: {
    gap: 10,
    paddingHorizontal: 4
  },
  cardSkeletonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4
  },
  profileSkeleton: {
    gap: theme.spacing.md
  },
  profileBlock: {
    gap: 10,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.obsidianRaised,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine
  }
});