import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/context/AuthContext";
import { StageBookProvider } from "../src/context/StageBookContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StageBookProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </StageBookProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}