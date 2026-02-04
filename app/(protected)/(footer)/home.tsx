import ShoppingListManager from "@/components/ShoppingListManager";
import colors from "@/constants/Colors";
import { View } from "react-native";

export default function Home() {
  const theme = "dark"; // or "dark", depending on your theme logic
  const c = colors[theme];

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
