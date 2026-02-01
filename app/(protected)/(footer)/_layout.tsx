import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "rgba(255,255,255,0.6)",
        tabBarStyle: {
          backgroundColor: "#0d0f16",
          borderTopColor: "rgba(255,255,255,0.12)",
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
