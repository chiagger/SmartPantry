import { ThemedText } from "@/components/ThemedText";
import colors from "@/constants/Colors";
import { auth } from "@/firebaseConfig";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function Settings() {
  const theme = "dark";
  const c = colors[theme];
  const styles = createStyles(c);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      <ThemedText style={styles.title}>Settings</ThemedText>
      <ThemedText style={styles.subtitle}>Coming soon.</ThemedText>
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

function createStyles(c: typeof colors.dark) {
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
