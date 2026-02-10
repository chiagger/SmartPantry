import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";

export default function NotFoundScreen() {
  const { t } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: t("not_found_stack_title") }} />
      <View style={styles.container}>
        <Text>{t("not_found_message")}</Text>
        <Link href="/" style={styles.link}>
          <Text>{t("not_found_go_home")}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
