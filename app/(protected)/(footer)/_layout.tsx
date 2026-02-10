import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import type { TranslationKey } from "@/constants/i18n";

type TabConfig = {
  name: string;
  titleKey: TranslationKey;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const tabs: TabConfig[] = [
  { name: "home", titleKey: "tabs_home", icon: "home-variant" },
  { name: "settings", titleKey: "tabs_settings", icon: "cog" },
];

export default function ProtectedTabsLayout() {
  const { theme, colors: c, t } = useTheme();
  const isDark = theme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? "#ffffff" : c.text,
        tabBarInactiveTintColor: isDark
          ? "rgba(255,255,255,0.6)"
          : "rgba(51,53,51,0.5)",
        tabBarStyle: {
          backgroundColor: isDark ? "#0d0f16" : c.background,
          borderTopColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.titleKey),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name={tab.icon}
                size={size ?? 22}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
