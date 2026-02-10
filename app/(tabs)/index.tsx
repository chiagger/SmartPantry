import colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { googleAuth } from "@/utils/auth/google";
import { router } from "expo-router";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("screen");

export default function Welcome() {
  const c = colors.dark;
  const { t } = useTheme();
  const styles = createStyles(c);

  return (
    <View
      style={{
        width: width,
        height: height,
        backgroundColor: c.background,
      }}
    >
      <View style={styles.root}>
        <Image
          source={require("@/assets/images/welcome.jpeg")}
          style={styles.heroImage}
        />
        <View style={styles.heroBlock}>
          <Text style={styles.heroIntro}>{t("welcome_intro")}</Text>
          <Text style={styles.heroTitle}>SmartPantry</Text>
          <Text style={styles.heroSubtitle}>{t("welcome_subtitle")}</Text>
        </View>
        <View style={styles.authCard}>
          <View style={[styles.section, { marginTop: 30 }]}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.primaryButtonText}>{t("welcome_continue_email")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.push("/register")}
            >
              <Text style={styles.secondaryButtonText}>
                {t("welcome_create_account_email")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t("common_or")}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.googleButton]}
              onPress={() => googleAuth(t)}
            >
              <Text style={styles.googleButtonText}>{t("welcome_continue_google")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

function createStyles(c: { [key: string]: string }) {
  return StyleSheet.create({
    root: {
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
    },
    heroImage: {
      width: width,
      height: 620,
      position: "absolute",
      top: 0,
    },
    section: { display: "flex", flexDirection: "column", gap: 10 },
    heroBlock: {
      height: "55%",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 64,
      paddingHorizontal: 24,
    },
    heroIntro: {
      fontSize: 24,
      fontFamily: "Montserrat-ExtraLight",
      color: c.text,
    },
    heroTitle: {
      marginTop: -6,
      fontSize: 46,
      fontFamily: "Montserrat-MediumItalic",
      textShadowColor: "rgba(0,0,0,0.35)",
      textShadowOffset: { width: 2, height: 3 },
      textShadowRadius: 6,
      color: c.text,
    },
    heroSubtitle: {
      textAlign: "center",
      fontFamily: "Montserrat-ExtraLight",
      opacity: 0.9,
      marginTop: 6,
      color: c.text,
    },
    authCard: {
      width: "88%",
      height: "35%",
      backgroundColor: "rgba(0,0,0,0.55)",
      borderRadius: 22,
      paddingHorizontal: 22,
      paddingVertical: 20,
      gap: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 18,
      display: "flex",
      justifyContent: "space-between",
      elevation: 6,
    },
    button: {
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 18,
      alignItems: "center",
    },
    primaryButton: {
      backgroundColor: c.primary,
    },
    primaryButtonText: {
      color: c.card,
      fontFamily: "Montserrat-SemiBold",
      fontSize: 16,
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.35)",
      backgroundColor: "rgba(255,255,255,0.08)",
    },
    secondaryButtonText: {
      color: "#fff",
      fontFamily: "Montserrat-SemiBold",
      fontSize: 15,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 2,
      marginBottom: 2,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: "rgba(255,255,255,0.2)",
    },
    dividerText: {
      opacity: 0.7,
      fontSize: 12,
      color: c.text,
    },
    googleButton: {
      backgroundColor: "#fff",
    },
    googleButtonText: {
      color: "#111",
      fontFamily: "Montserrat-SemiBold",
      fontSize: 15,
    },
  });
}
