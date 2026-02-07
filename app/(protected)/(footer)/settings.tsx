import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { auth } from "@/firebaseConfig";
import { useState } from "react";
import { StyleSheet, Switch, TouchableOpacity, View } from "react-native";

export default function Settings() {
  const { theme, setTheme, colors: c } = useTheme();
  const styles = createStyles(c);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      <ThemedText style={styles.title}>Settings</ThemedText>
      <ThemedText style={styles.subtitle}>Customize your experience.</ThemedText>
      <View style={styles.toggleRow}>
        <ThemedText style={styles.toggleLabel}>Dark mode</ThemedText>
        <Switch
          value={theme === "dark"}
          onValueChange={(value) => setTheme(value ? "dark" : "light")}
          trackColor={{ false: c.gray, true: c.primary }}
          thumbColor={c.card}
        />
      </View>
      {errorMessage !== "" && (
        <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
      )}
      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        disabled={loading}
        onPress={() => {
          setLoading(true);
          setErrorMessage("");
          auth
            .signOut()
            .catch((error: any) => {
              setErrorMessage(`Errore: ${error.message}`);
            })
            .finally(() => setLoading(false));
        }}
      >
        <ThemedText style={styles.logoutText}>
          {loading ? "Logging out..." : "Logout"}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(c: { [key: string]: string }) {
  return StyleSheet.create({
    page: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 10,
    },
    title: {
      fontSize: 24,
      fontFamily: "Montserrat-SemiBold",
      color: c.text,
    },
    subtitle: {
      fontFamily: "Montserrat-Regular",
      opacity: 0.7,
    },
    toggleRow: {
      width: "100%",
      maxWidth: 360,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
      backgroundColor: "rgba(255,255,255,0.04)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    toggleLabel: {
      fontFamily: "Montserrat-Regular",
    },
    button: {
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 18,
      alignItems: "center",
      minWidth: 180,
    },
    logoutButton: {
      backgroundColor: c.primary,
      marginTop: 8,
    },
    logoutText: {
      color: c.card,
      fontFamily: "Montserrat-SemiBold",
      fontSize: 15,
    },
    errorText: {
      color: c.alert,
      fontFamily: "Montserrat-Regular",
      fontSize: 13,
      textAlign: "center",
    },
  });
}
