import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { auth } from "@/firebaseConfig";
import { useState } from "react";
import { StyleSheet, Switch, TouchableOpacity, View } from "react-native";

const LANGUAGES = ["en", "it"] as const;

export default function Settings() {
  const { theme, setTheme, language, setLanguage, t, colors: c } = useTheme();
  const styles = createStyles(c);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      <ThemedText style={styles.title}>{t("settings_title")}</ThemedText>
      <ThemedText style={styles.subtitle}>{t("settings_subtitle")}</ThemedText>
      <View style={styles.toggleRow}>
        <ThemedText style={styles.toggleLabel}>{t("settings_dark_mode")}</ThemedText>
        <Switch
          value={theme === "dark"}
          onValueChange={(value) => setTheme(value ? "dark" : "light")}
          trackColor={{ false: c.gray, true: c.primary }}
          thumbColor={c.card}
        />
      </View>
      <View style={styles.languageCard}>
        <ThemedText style={styles.toggleLabel}>{t("settings_language")}</ThemedText>
        <View style={styles.languageRow}>
          {LANGUAGES.map((code) => {
            const isSelected = language === code;
            return (
              <TouchableOpacity
                key={code}
                onPress={() => setLanguage(code)}
                style={[
                  styles.languageButton,
                  isSelected && { backgroundColor: c.primary, borderColor: c.primary },
                ]}
              >
                <ThemedText
                  style={[
                    styles.languageButtonText,
                    { color: isSelected ? c.card : c.text },
                  ]}
                >
                  {code === "it"
                    ? t("settings_language_italian")
                    : t("settings_language_english")}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
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
              setErrorMessage(`${t("common_error_prefix")} ${error.message}`);
            })
            .finally(() => setLoading(false));
        }}
      >
        <ThemedText style={styles.logoutText}>
          {loading ? t("settings_logging_out") : t("settings_logout")}
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
    languageCard: {
      width: "100%",
      maxWidth: 360,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
      backgroundColor: "rgba(255,255,255,0.04)",
      gap: 10,
    },
    languageRow: {
      flexDirection: "row",
      gap: 8,
    },
    languageButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      borderRadius: 10,
      paddingVertical: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.02)",
    },
    languageButtonText: {
      fontFamily: "Montserrat-SemiBold",
      fontSize: 13,
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
