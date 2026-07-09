import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { theme } from "../theme/theme";

interface FloatingSurfaceProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  noPadding?: boolean;
}

export function FloatingSurface({
  children,
  style,
  padding = theme.spacing.md,
  noPadding = false
}: FloatingSurfaceProps) {
  return (
    <View style={[styles.surface, theme.shadow.float, style]}>
      <View style={[styles.inner, noPadding ? null : { padding }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: theme.colors.obsidianRaised,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine,
    overflow: "hidden"
  },
  inner: {
    gap: theme.spacing.sm
  }
});