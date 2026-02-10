import type { TranslationKey, TranslationParams } from "@/constants/i18n";
import { auth, db } from "@/firebaseConfig";
import {
  GoogleAuthProvider,
  signInWithCredential,
} from "@react-native-firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "@react-native-firebase/firestore";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Href, router } from "expo-router";
import { Alert } from "react-native";

export const googleAuth = async (
  t: (key: TranslationKey, params?: TranslationParams) => string,
) => {
  try {
    await GoogleSignin.hasPlayServices();

    const user = await GoogleSignin.signIn();

    const idToken = user.data?.idToken;

    if (idToken) {
      const googleCredential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, googleCredential);
    }

    const currentUser = auth.currentUser;

    if (currentUser) {
      const usersCollection = collection(db, "users");
      const q = query(usersCollection, where("uid", "==", currentUser.uid));
      const userSnap = await getDocs(q);

      if (userSnap.empty) {
        const userDocRef = doc(db, "users", currentUser.uid);

        await setDoc(userDocRef, {
          uid: currentUser.uid,
          name: currentUser.displayName?.split(" ")[0],
          surname: currentUser.displayName?.split(" ")[1],
          email: currentUser.email,
          role: "user",
          createdAt: new Date(),
        });
      }

      router.navigate("/(protected)/(footer)/home" as Href);
    }
  } catch (error) {
    console.log(error);
    Alert.alert(t("auth_google_error_title"), t("auth_google_error_message"));
  }
};
