import colors from "@/constants/Colors";
import { Dimensions, View } from "react-native";

const { width, height } = Dimensions.get("screen");
export default function Welcome() {
  const theme = "dark"; // or "dark", depending on your theme logic
  const c = colors[theme];

  return (
    <View
      style={{
        width: width,
        height: height,
        backgroundColor: c.background,
      }}
    ></View>
  );
}
