import { useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { theme } from "../theme/theme";

interface SignaturePadProps {
  label: string;
  onSave: (dataUrl: string) => void;
  disabled?: boolean;
}

export function SignaturePad({ label, onSave, disabled = false }: SignaturePadProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const pathRef = useRef("");

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        pathRef.current = `M${locationX},${locationY}`;
        setCurrentPath(pathRef.current);
      },
      onPanResponderMove: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        pathRef.current += ` L${locationX},${locationY}`;
        setCurrentPath(pathRef.current);
      },
      onPanResponderRelease: () => {
        if (pathRef.current) {
          setPaths((prev) => [...prev, pathRef.current]);
          pathRef.current = "";
          setCurrentPath("");
        }
      }
    })
  ).current;

  function clear() {
    setPaths([]);
    setCurrentPath("");
    pathRef.current = "";
  }

  function save() {
    if (!paths.length || disabled) return;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="160" viewBox="0 0 480 160"><rect width="100%" height="100%" fill="#0f0f0f"/>${paths
      .map((path) => `<path d="${path}" stroke="#CBA848" stroke-width="2.4" fill="none" stroke-linecap="round"/>`)
      .join("")}</svg>`;
    onSave(`data:image/svg+xml,${encodeURIComponent(svg)}`);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.canvas} {...panResponder.panHandlers}>
        <Svg width="100%" height={160}>
          {paths.map((path, index) => (
            <Path key={index} d={path} stroke={theme.colors.gold} strokeWidth={2.4} fill="none" />
          ))}
          {currentPath ? (
            <Path d={currentPath} stroke={theme.colors.gold} strokeWidth={2.4} fill="none" />
          ) : null}
        </Svg>
      </View>
      <View style={styles.actions}>
        <Text style={styles.ghost} onPress={clear}>
          Clear
        </Text>
        <Text style={[styles.save, (!paths.length || disabled) && styles.saveDisabled]} onPress={save}>
          Save signature
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { color: theme.colors.gold, fontSize: 12, letterSpacing: 1.1, textTransform: "uppercase" },
  canvas: {
    height: 160,
    borderWidth: 1,
    borderColor: theme.colors.borderGold,
    borderRadius: 12,
    backgroundColor: "#0f0f0f",
    overflow: "hidden"
  },
  actions: { flexDirection: "row", gap: 16 },
  ghost: { color: theme.colors.textMuted, fontWeight: "600" },
  save: { color: theme.colors.gold, fontWeight: "700" },
  saveDisabled: { opacity: 0.4 }
});