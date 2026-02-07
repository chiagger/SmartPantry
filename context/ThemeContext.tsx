import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import colors from "@/constants/Colors";
import { auth, db } from "@/firebaseConfig";
import { onAuthStateChanged } from "@react-native-firebase/auth";
import { doc, onSnapshot, setDoc } from "@react-native-firebase/firestore";

export type ThemeName = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
  colors: (typeof colors)[ThemeName];
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [theme, setTheme] = useState<ThemeName>(
    system === "dark" ? "dark" : "light",
  );
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [remoteLoaded, setRemoteLoaded] = useState(false);

  const value = useMemo<ThemeContextValue>(() => {
    return {
      theme,
      setTheme,
      toggleTheme: () =>
        setTheme((prev) => (prev === "dark" ? "light" : "dark")),
      colors: colors[theme],
    };
  }, [theme]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setActiveUid(user?.uid ?? null);
      setRemoteLoaded(false);
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!activeUid) return;
    const userRef = doc(db, "users", activeUid);
    const unsub = onSnapshot(userRef, (snap) => {
      const data = snap.data() as { theme?: ThemeName } | undefined;
      if (data?.theme === "light" || data?.theme === "dark") {
        setTheme(data.theme);
      }
      setRemoteLoaded(true);
    });
    return unsub;
  }, [activeUid]);

  useEffect(() => {
    if (!activeUid || !remoteLoaded) return;
    const userRef = doc(db, "users", activeUid);
    setDoc(
      userRef,
      {
        theme,
      },
      { merge: true },
    );
  }, [activeUid, remoteLoaded, theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
