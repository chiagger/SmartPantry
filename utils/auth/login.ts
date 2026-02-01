import { signInWithEmailAndPassword } from "@react-native-firebase/auth";
import { auth } from "../../firebaseConfig";

export const handleLoginEmail = async (
  email: string,
  password: string,
  setErrorMessage: (message: string) => void,
) => {
  if (!email || !password) {
    setErrorMessage("Email and password are required");
    return false;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    return true;
  } catch (error: any) {
    if (error.code === "auth/invalid-credential") {
      setErrorMessage("Invalid email or password");
    } else if (error.code === "auth/user-not-found") {
      setErrorMessage("No account found for this email");
    } else if (error.code === "auth/invalid-email") {
      setErrorMessage("Invalid email format");
    } else {
      setErrorMessage(`Errore: ${error.message}`);
    }
    return false;
  }
};
