import { signInWithEmailAndPassword } from "@react-native-firebase/auth";
import type { TranslationKey, TranslationParams } from "@/constants/i18n";
import { auth } from "../../firebaseConfig";

export const handleLoginEmail = async (
  email: string,
  password: string,
  setErrorMessage: (message: string) => void,
  t: (key: TranslationKey, params?: TranslationParams) => string,
) => {
  if (!email || !password) {
    setErrorMessage(t("auth_email_password_required"));
    return false;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    return true;
  } catch (error: any) {
    if (error.code === "auth/invalid-credential") {
      setErrorMessage(t("auth_invalid_credentials"));
    } else if (error.code === "auth/user-not-found") {
      setErrorMessage(t("auth_no_account_email"));
    } else if (error.code === "auth/invalid-email") {
      setErrorMessage(t("auth_invalid_email_format"));
    } else {
      setErrorMessage(`${t("common_error_prefix")} ${error.message}`);
    }
    return false;
  }
};
