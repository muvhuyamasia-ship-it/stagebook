import { Tabs } from "expo-router";
import { STAGEBOOK_APP_TABS } from "@stagebook/shared";
import { theme } from "../../src/theme/theme";

export default function TabsLayout() {
  const tabs = STAGEBOOK_APP_TABS.filter((t) => t.id !== "earnings" || true);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8
        },
        tabBarActiveTintColor: theme.colors.gold,
        tabBarInactiveTintColor: theme.colors.textMuted
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