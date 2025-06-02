import { ThemedText } from "@/components/ThemedText";
import colors from "@/constants/Colors";
import { Dimensions, Image, TouchableOpacity, View } from "react-native";

const { width, height } = Dimensions.get("screen");
// Remove invalid import. Use require for images in React Native.
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
    >
      <View
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <Image
          source={require("@/assets/images/welcome.jpeg")}
          style={{ width: width, height: 600, position: "absolute", top: 0 }}
        />
        <View
          style={{
            height: "60%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: 60,
          }}
        >
          <ThemedText
            style={{ fontSize: 25, fontFamily: "Montserrat-ExtraLight" }}
          >
            Welcome to
          </ThemedText>
          <ThemedText
            style={{
              marginTop: -5,
              fontSize: 45,
              fontFamily: "Montserrat-MediumItalic",
              textShadowColor: "rgba(0,0,0,0.4)",
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 4,
            }}
          >
            SmartPantry
          </ThemedText>
          <ThemedText
            style={{
              textAlign: "center",
              fontFamily: "Montserrat-ExtraLight",
            }}
          >
            Your AI-powered{"\n"}kitchen & groceries companion.
          </ThemedText>
        </View>
        <View
          style={{
            height: "40%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: c.primary,
              paddingHorizontal: 30,
              paddingVertical: 10,
              borderRadius: 5,
            }}
          >
            <ThemedText
              style={{
                color: c.card,
              }}
            >
              Login with email
            </ThemedText>
          </TouchableOpacity>

          <ThemedText>or</ThemedText>

          <TouchableOpacity
            style={{
              backgroundColor: c.card,
              paddingHorizontal: 30,
              paddingVertical: 10,
              borderRadius: 5,
            }}
          >
            <ThemedText>Login with google</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
