import { ThemedText } from "@/components/ThemedText";
import colors from "@/constants/Colors";
import { handleRegisterEmail } from "@/utils/auth/register";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("screen");

export default function Register() {
  const theme = "dark";
  const c = colors[theme];
  const styles = createStyles(c);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState<string>("");
  const [surname, setSurname] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const validatePassword = () => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password))
      return "Password must include an uppercase letter";
    if (!/[0-9]/.test(password)) return "Password must include a number";
    if (!/[^A-Za-z0-9]/.test(password))
      return "Password must include a special character";
    if (password !== confirmPassword) return "Passwords do not match";
    return "";
  };

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      <Image
        source={require("@/assets/images/welcome.jpeg")}
        style={styles.backgroundImage}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            router.replace("/");
          }}
        >
          <ThemedText style={styles.backText}>Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Create account</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 140 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <ThemedText style={styles.cardTitle}>
              Start your SmartPantry journey
            </ThemedText>
            <ThemedText style={styles.cardSubtitle}>
              Fill in your details to register with email.
            </ThemedText>

            <View style={styles.form}>
              <View style={styles.row}>
                <TextInput
                  placeholder="Name"
                  placeholderTextColor="rgba(255,255,255,0.55)"
                  style={[styles.input, styles.inputHalf]}
                  value={name}
                  onChangeText={setName}
                />
                <TextInput
                  placeholder="Surname"
                  placeholderTextColor="rgba(255,255,255,0.55)"
                  style={[styles.input, styles.inputHalf]}
                  value={surname}
                  onChangeText={setSurname}
                />
              </View>
              <TextInput
                placeholder="Date of birth (MM/DD/YYYY)"
                placeholderTextColor="rgba(255,255,255,0.55)"
                style={styles.input}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
              />
              <TextInput
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.55)"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
              />
              <View style={styles.inputWithIcon}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.55)"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={[styles.input, styles.inputWithPadding]}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="rgba(255,255,255,0.75)"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.inputWithIcon}>
                <TextInput
                  placeholder="Confirm password"
                  placeholderTextColor="rgba(255,255,255,0.55)"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  style={[styles.input, styles.inputWithPadding]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color="rgba(255,255,255,0.75)"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {errorMessage !== "" && (
              <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            )}

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => {
                const passwordError = validatePassword();
                if (passwordError) {
                  setErrorMessage(passwordError);
                  return;
                }
                setLoading(true);
                handleRegisterEmail(
                  name,
                  surname,
                  email,
                  password,
                  setErrorMessage,
                ).then(() => {
                  setLoading(false);
                  if (errorMessage === "") {
                    router.replace("/(protected)/(footer)/home");
                  }
                });
              }}
              disabled={loading}
            >
              <ThemedText style={styles.primaryButtonText}>
                {loading ? "Creating..." : "Create account"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(c: typeof colors.dark) {
  return StyleSheet.create({
    page: {
      flex: 1,
    },
    backgroundImage: {
      position: "absolute",
      width,
      height,
      opacity: 0.25,
      top: 0,
    },
    content: {
      flexGrow: 1,
      minHeight: height,
      paddingTop: 90,
      paddingBottom: 180,
      paddingHorizontal: 20,
      justifyContent: "center",
      gap: 16,
    },
    header: {
      zIndex: 10,
      elevation: 10,
      position: "absolute",
      top: 60,
      left: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
    },
    backText: {
      color: c.primary,
      fontFamily: "Montserrat-SemiBold",
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: "Montserrat-SemiBold",
    },
    card: {
      backgroundColor: "rgba(0,0,0,0.55)",
      borderRadius: 22,
      padding: 18,
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 18,
      elevation: 6,
    },
    cardTitle: {
      fontSize: 20,
      fontFamily: "Montserrat-SemiBold",
    },
    cardSubtitle: {
      fontFamily: "Montserrat-ExtraLight",
      opacity: 0.8,
    },
    form: {
      gap: 8,
    },
    row: {
      flexDirection: "row",
      gap: 12,
    },
    input: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: "rgba(255,255,255,0.06)",
      color: "#fff",
      fontFamily: "Montserrat-Regular",
      minHeight: 50,
    },
    inputWithIcon: {
      position: "relative",
      justifyContent: "center",
    },
    inputWithPadding: {
      paddingRight: 44,
    },
    eyeButton: {
      position: "absolute",
      right: 14,
      height: "100%",
      justifyContent: "center",
    },
    inputHalf: {
      flex: 1,
    },
    button: {
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 18,
      alignItems: "center",
    },
    primaryButton: {
      backgroundColor: c.primary,
      marginTop: 4,
    },
    primaryButtonText: {
      color: c.card,
      fontFamily: "Montserrat-SemiBold",
      fontSize: 16,
    },
    errorText: {
      color: c.alert,
      fontFamily: "Montserrat-Regular",
      fontSize: 13,
      textAlign: "center",
    },
    flex: {
      flex: 1,
    },
  });
}
