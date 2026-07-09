import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import { StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme/theme";

interface BlurHeaderProps {
  title: string;
  subtitle?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  children: ReactNode;
  contentContainerStyle?: object;
}

export function BlurHeader({
  title,
  subtitle,
  leftSlot,
  rightSlot,
  children,
  contentContainerStyle
}: BlurHeaderProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    }
  });

  const headerBorderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 24], [0, 1], Extrapolation.CLAMP)
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 60], [0, -2], Extrapolation.CLAMP)
      }
    ]
  }));

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 72, paddingBottom: insets.bottom + 96 },
          contentContainerStyle
        ]}
      >
        {children}
      </Animated.ScrollView>

      <View style={[styles.headerWrap, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <BlurView intensity={72} tint="dark" style={StyleSheet.absoluteFill} />
        <Animated.View style={[styles.headerBorder, headerBorderStyle]} />
        <Animated.View style={[styles.headerRow, titleStyle]}>
          {leftSlot ? <View style={styles.headerSide}>{leftSlot}</View> : null}
          <View
            style={[
              styles.headerText,
              leftSlot || rightSlot ? styles.headerTextCentered : null
            ]}
          >
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {rightSlot ? <View style={styles.headerSide}>{rightSlot}</View> : null}
        </Animated.View>
      </View>
    </View>
  );
}

/** Scroll offset helper for nested lists */
export function useBlurScrollOffset() {
  const scrollY = useSharedValue(0);
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };
  return { scrollY, onScroll };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.obsidian
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md
  },
  headerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    overflow: "hidden"
  },
  headerBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.borderFine
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    minHeight: 52
  },
  headerSide: {
    minWidth: 44
  },
  headerText: {
    flex: 1,
    gap: 2
  },
  headerTextCentered: {
    alignItems: "center"
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted
  }
});