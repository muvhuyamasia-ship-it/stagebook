import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { STAGEBOOK_APP_TABS } from "@stagebook/shared";
import { theme } from "../../src/theme/theme";

export default function TabsLayout() {
  const tabs = STAGEBOOK_APP_TABS.filter((t) => t.id !== "earnings" || true);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarBackground: () => (
          <BlurView intensity={72} tint="dark" style={StyleSheet.absoluteFill} />
        ),
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.borderFine,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 0
        },
        tabBarActiveTintColor: theme.colors.gold,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          ...theme.typography.caption,
          fontWeight: "600"
        }
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.id}
          name={tab.id}
          options={{
            title: tab.label,
            tabBarIcon: () => null,
            tabBarLabel: `${tab.icon} ${tab.label}`
          }}
        />
      ))}
    </Tabs>
  );
}