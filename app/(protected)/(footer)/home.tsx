import ShoppingListManager from "@/components/ShoppingListManager";
import { useTheme } from "@/context/ThemeContext";
import { View } from "react-native";

export default function Home() {
  const { colors: c } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.background,
        paddingTop: 24,
        paddingBottom: 24,
        alignItems: "center",
      }}
    >
      <ShoppingListManager />
    </View>
  );
}
