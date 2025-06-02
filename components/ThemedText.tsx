import colors from "@/constants/Colors";
import { Text, TextProps } from "react-native";
export const ThemedText = ({
  children,
  style,
  ...rest
}: { children: React.ReactNode } & TextProps) => {
  const theme = "dark"; // or "light", depending on your theme logic
  const c = colors[theme];
  return (
    <Text
      style={[
        { color: c.text, fontSize: 16, fontFamily: "Montserrat-Regular" },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};
