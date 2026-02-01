import { ThemedText } from "@/components/ThemedText";
import colors from "@/constants/Colors";
import { router } from "expo-router";
import {
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("screen");

export default function Welcome() {
  const theme = "dark";
  const c = colors[theme];
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
          <ThemedText style={styles.heroIntro}>Welcome to</ThemedText>
          <ThemedText style={styles.heroTitle}>SmartPantry</ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Your AI-powered{"\n"}kitchen & groceries companion.
          </ThemedText>
        </View>
        <View style={styles.authCard}>
          <View style={[styles.section, { marginTop: 30 }]}>
            <TouchableOpacity style={[styles.button, styles.primaryButton]}>
              <ThemedText style={styles.primaryButtonText}>
                Continue with email
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.push("/register")}
            >
              <ThemedText style={styles.secondaryButtonText}>
                Create account with email
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <ThemedText style={styles.dividerText}>or</ThemedText>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={[styles.button, styles.googleButton]}>
              <ThemedText style={styles.googleButtonText}>
                Continue with Google
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

function createStyles(c: typeof colors.dark) {
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
    },
    heroTitle: {
      marginTop: -6,
      fontSize: 46,
      fontFamily: "Montserrat-MediumItalic",
      textShadowColor: "rgba(0,0,0,0.35)",
      textShadowOffset: { width: 2, height: 3 },
      textShadowRadius: 6,
    },
    heroSubtitle: {
      textAlign: "center",
      fontFamily: "Montserrat-ExtraLight",
      opacity: 0.9,
      marginTop: 6,
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
