import { ThemedText } from "@/components/ThemedText";
import colors from "@/constants/Colors";
import { Image, View } from "react-native";

const banana = require("../../../assets/images/icons/banana.png");

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
      <Image source={banana} style={{ width: 64, height: 64, marginTop: 12 }} />
    </View>
  );
}
