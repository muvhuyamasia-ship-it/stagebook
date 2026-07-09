import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, "style"> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: "light" | "medium" | "selection" | "none";
  scaleTo?: number;
}

export function PressableScale({
  children,
  style,
  haptic = "light",
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  function triggerHaptic() {
    if (haptic === "none" || disabled) return;
    if (haptic === "selection") {
      void Haptics.selectionAsync();
      return;
    }
    void Haptics.impactAsync(
      haptic === "medium" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
    );
  }

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      style={[animatedStyle, style]}
      onPressIn={(event) => {
        scale.value = withSpring(scaleTo, { damping: 18, stiffness: 320 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
        onPressOut?.(event);
      }}
      onPress={(event) => {
        triggerHaptic();
        onPress?.(event);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}