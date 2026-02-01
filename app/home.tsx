import { ThemedText } from "@/components/ThemedText";
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
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ThemedText style={{ fontSize: 28, fontFamily: "Montserrat-SemiBold" }}>
        Home
      </ThemedText>
    </View>
  );
}
