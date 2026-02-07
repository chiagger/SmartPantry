import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

type TabConfig = {
  name: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const tabs: TabConfig[] = [
  { name: "home", title: "Home", icon: "home-variant" },
  { name: "settings", title: "Settings", icon: "cog" },
];

export default function ProtectedTabsLayout() {
  const { theme, colors: c } = useTheme();
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
            title: tab.title,
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
