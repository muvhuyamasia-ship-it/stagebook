import "react-native-reanimated";
import { Stack } from "expo-router";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/context/AuthContext";
import { SheetProvider } from "../src/context/SheetContext";
import { StageBookProvider } from "../src/context/StageBookContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <StageBookProvider>
            <SheetProvider>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#08080A" } }} />
            </SheetProvider>
          </StageBookProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  }
});