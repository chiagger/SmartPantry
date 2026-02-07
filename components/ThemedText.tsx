import { useTheme } from "@/context/ThemeContext";
import { Text, TextProps } from "react-native";
export const ThemedText = ({
  children,
  style,
  ...rest
}: { children: React.ReactNode } & TextProps) => {
  const { colors: c } = useTheme();
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
