import { createUserWithEmailAndPassword } from "@react-native-firebase/auth";
import type { TranslationKey, TranslationParams } from "@/constants/i18n";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "@react-native-firebase/firestore";
import { Href, router } from "expo-router";
import { auth, db } from "../../firebaseConfig";

export const handleRegisterEmail = async (
  name: string,
  surname: string,
  email: string,
  password: string,
  setErrorMessage: (message: string) => void,
  t: (key: TranslationKey, params?: TranslationParams) => string,
) => {
  if (name && surname && email && password) {
    try {
      const usersCollection = collection(db, "users");
      const q = query(usersCollection, where("email", "==", `${email}`));
      const userSnap = await getDocs(q);

      if (!userSnap.empty) {
        setErrorMessage(t("auth_account_exists"));
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const currentUser = userCredential.user;
        // Create user document in Firestore.
        if (currentUser) {
          const userDocRef = doc(db, "users", currentUser.uid);

          await setDoc(userDocRef, {
            uid: currentUser.uid,
            name,
            surname,
            email,
            role: "user",
            createdAt: new Date(),
          });

          router.navigate("/(protected)/(footer)/home" as Href);
        }
      }
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setErrorMessage(t("auth_email_already_registered"));
      } else {
        setErrorMessage(`${t("common_error_prefix")} ${error.message}`);
      }
    }
  } else {
    setErrorMessage(t("auth_all_fields_required"));
  }
};
