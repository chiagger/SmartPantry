import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import FoodIconSearch, { Match } from "@/components/FoodIconSearch";
import { useTheme } from "@/context/ThemeContext";
import { auth, db } from "@/firebaseConfig";
import { FOOD_ICON_INDEX } from "@/utils/foodIconIndex";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { onAuthStateChanged } from "@react-native-firebase/auth";
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "@react-native-firebase/firestore";
import * as Clipboard from "expo-clipboard";
import { Swipeable } from "react-native-gesture-handler";

type Item = {
  id: string;
  key: string;
  source: number;
  label: string;
};

function toItem(id: string, key: string, label?: string): Item {
  return { id, key, source: FOOD_ICON_INDEX[key], label: label ?? key };
}

function normalizeLabel(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ShoppingListManager() {
  const { theme, colors: c } = useTheme();
  const isDark = theme === "dark";
  const surfaceCard = isDark ? "rgba(18,18,18,0.88)" : "rgba(255,255,255,0.96)";
  const surfaceHero = isDark ? "rgba(16,16,16,0.92)" : "rgba(255,255,255,0.98)";
  const surfaceRow = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const surfaceBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
  const fadeColor = isDark ? "rgba(18,18,18,0.9)" : "rgba(255,255,255,0.95)";
  const dimmedTextColor = isDark ? c.gray : "rgba(43,45,45,0.65)";
  const dimmedOpacity = isDark ? 0.55 : 0.82;
  const subtitleColor = isDark
    ? "rgba(237,237,231,0.85)"
    : "rgba(43,45,45,0.85)";
  const sectionMetaColor = isDark
    ? "rgba(255,255,255,0.7)"
    : "rgba(43,45,45,0.65)";
  const scrollPillBg = isDark ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.85)";
  const scrollPillBorder = isDark
    ? "rgba(255,255,255,0.15)"
    : "rgba(0,0,0,0.08)";
  const scrollTextColor = isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)";
  const maxQuickQty = 20;

  const currentListRef = useRef<FlatList<Item> | null>(null);
  const recentlyReaddedRef = useRef<Set<string>>(new Set());
  const [currentList, setCurrentList] = useState<Item[]>([]);
  const [pastList, setPastList] = useState<Item[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [listIds, setListIds] = useState<string[]>([]);
  const [listMeta, setListMeta] = useState<
    Record<string, { name?: string; shared?: boolean }>
  >({});
  const [shareCodeInput, setShareCodeInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [needsListSetup, setNeedsListSetup] = useState(false);
  const [listNameInput, setListNameInput] = useState("");
  const [isRenamingListName, setIsRenamingListName] = useState(false);
  const [pendingListName, setPendingListName] = useState("");
  const [copyHint, setCopyHint] = useState<"code" | "link" | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentIds = useMemo(
    () => new Set(currentList.map((i) => i.id)),
    [currentList],
  );
  const pastIds = useMemo(() => new Set(pastList.map((i) => i.id)), [pastList]);

  const [notice, setNotice] = useState<string | null>(null);
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const [currentAtEnd, setCurrentAtEnd] = useState(false);
  const [pastAtEnd, setPastAtEnd] = useState(false);
  const [searchDockHeight, setSearchDockHeight] = useState(0);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const keyboardOffsetAnim = useRef(new Animated.Value(0)).current;
  const tabBarHeight = Platform.OS === "android" ? 56 : 0;
  const keyboardLift = Math.max(0, keyboardOffset - tabBarHeight);
  const keyboardVisible = keyboardOffset > 0;
  const defaultKeyboardHeight = Platform.OS === "android" ? 280 : 300;
  const lastKeyboardHeight = useRef(defaultKeyboardHeight);
  const listDimOpacity = keyboardOffsetAnim.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0.35],
    extrapolate: "clamp",
  });
  const isSharedList = Boolean(activeListId && listMeta[activeListId]?.shared);
  const shareLink =
    isSharedList && activeListId
      ? `smartpantry://join?code=${activeListId}`
      : "";

  const getItemsCollectionRef = useCallback(
    (uid: string) => {
      if (activeListId) {
        if (activeListId.startsWith("user:")) {
          return collection(db, "users", uid, "shopping_items");
        }
        return collection(db, "lists", activeListId, "items");
      }
      return collection(db, "users", uid, "shopping_items");
    },
    [activeListId],
  );

  const getListLabel = useCallback(
    (id: string) => {
      const name = listMeta[id]?.name;
      if (name) return name;
      if (id.startsWith("user:")) return "My List";
      return `Shared: ${id}`;
    },
    [listMeta],
  );

  const animateKeyboard = useCallback(
    (height: number, duration: number) => {
      Animated.timing(keyboardOffsetAnim, {
        toValue: Math.max(0, height - tabBarHeight),
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    },
    [keyboardOffsetAnim, tabBarHeight],
  );

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e.endCoordinates?.height ?? 0;
      if (height > 0) {
        lastKeyboardHeight.current = height;
      }
      setKeyboardOffset(height);
      const duration = e.duration ?? (Platform.OS === "android" ? 160 : 220);
      animateKeyboard(height, duration);
    });
    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      setKeyboardOffset(0);
      const duration = e?.duration ?? (Platform.OS === "android" ? 160 : 200);
      animateKeyboard(0, duration);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [animateKeyboard]);

  useEffect(() => {
    let unsubUser: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setActiveUid(user?.uid ?? null);
      if (unsubUser) {
        unsubUser();
        unsubUser = undefined;
      }

      if (!user) {
        setCurrentList([]);
        setPastList([]);
        setActiveListId(null);
        setListIds([]);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      unsubUser = onSnapshot(userRef, (snap) => {
        if (!snap.exists()) {
          setListIds([]);
          setActiveListId(null);
          setListMeta({});
          setNeedsListSetup(true);
          return;
        }
        const data = snap.data() as {
          activeListId?: string | null;
          listIds?: string[];
        };
        const existingListIds = data.listIds ?? [];
        if (!existingListIds.length) {
          setListIds([]);
          setActiveListId(null);
          setListMeta({});
          setNeedsListSetup(true);
          return;
        }
        setListIds(existingListIds);
        setActiveListId(data.activeListId ?? existingListIds[0] ?? null);
        setNeedsListSetup(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  useEffect(() => {
    if (!activeUid || !activeListId) return;
    const itemsRef = getItemsCollectionRef(activeUid);
    const currentQuery = query(
      itemsRef,
      where("deleted", "==", false),
      where("status", "==", "current"),
    );
    const pastQuery = query(
      itemsRef,
      where("deleted", "==", false),
      where("status", "==", "past"),
    );

    const unsubCurrent = onSnapshot(
      currentQuery,
      (snap) => {
        if (!snap) return;
        const next = snap.docs.map(
          (docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
            const data = docSnap.data() as {
              label: string;
              iconKey: string;
              updatedAt?: FirebaseFirestoreTypes.Timestamp | null;
            };
            return {
              item: toItem(docSnap.id, data.iconKey, data.label),
              updatedAt: data.updatedAt?.toMillis?.() ?? 0,
            };
          },
        );
        setCurrentList((prev) => {
          const prevIndex = new Map(prev.map((item, idx) => [item.id, idx]));
          const ordered = next
            .slice()
            .sort(
              (
                a: { item: Item; updatedAt: number },
                b: { item: Item; updatedAt: number },
              ) => {
                const readdedA = recentlyReaddedRef.current.has(a.item.id);
                const readdedB = recentlyReaddedRef.current.has(b.item.id);
                if (readdedA && !readdedB) return -1;
                if (readdedB && !readdedA) return 1;
                const indexA = prevIndex.get(a.item.id);
                const indexB = prevIndex.get(b.item.id);
                if (indexA !== undefined && indexB !== undefined) {
                  return indexA - indexB;
                }
                if (indexA !== undefined) return -1;
                if (indexB !== undefined) return 1;
                return b.updatedAt - a.updatedAt;
              },
            )
            .map((entry: { item: Item; updatedAt: number }) => entry.item);
          for (const entry of ordered) {
            if (recentlyReaddedRef.current.has(entry.id)) {
              recentlyReaddedRef.current.delete(entry.id);
            }
          }
          return ordered;
        });
      },
      (error) => {
        setNotice(`Current list error: ${error.message}`);
      },
    );

    const unsubPast = onSnapshot(
      pastQuery,
      (snap) => {
        if (!snap) return;
        const next = snap.docs
          .map((docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
            const data = docSnap.data() as {
              label: string;
              iconKey: string;
              lastUsedAt?: FirebaseFirestoreTypes.Timestamp | null;
            };
            return {
              item: toItem(docSnap.id, data.iconKey, data.label),
              lastUsedAt: data.lastUsedAt?.toMillis?.() ?? 0,
            };
          })
          .sort(
            (
              a: { item: Item; lastUsedAt: number },
              b: { item: Item; lastUsedAt: number },
            ) => b.lastUsedAt - a.lastUsedAt,
          )
          .map((entry: { item: Item; lastUsedAt: number }) => entry.item);
        setPastList(next);
      },
      (error) => {
        setNotice(`Past list error: ${error.message}`);
      },
    );

    return () => {
      unsubCurrent();
      unsubPast();
    };
  }, [activeUid, activeListId, getItemsCollectionRef]);

  useEffect(() => {
    let cancelled = false;
    async function hydrateListMeta() {
      if (!activeUid || !listIds.length) {
        setListMeta({});
        return;
      }
      const results = await Promise.all(
        listIds.map(async (id) => {
          const snap = await getDoc(doc(db, "lists", id));
          const data = snap.data() as
            | { name?: string; shared?: boolean }
            | undefined;
          return { id, name: data?.name, shared: data?.shared };
        }),
      );
      if (cancelled) return;
      const nextMeta: Record<string, { name?: string; shared?: boolean }> = {};
      for (const entry of results) {
        if (entry.name || entry.shared !== undefined) {
          nextMeta[entry.id] = {
            name: entry.name,
            shared: entry.shared,
          };
        }
      }
      setListMeta(nextMeta);
    }
    void hydrateListMeta();
    return () => {
      cancelled = true;
    };
  }, [activeUid, listIds]);

  useEffect(() => {
    if (!activeListId) return;
    if (isRenamingListName) return;
    const existingName = listMeta[activeListId]?.name ?? "";
    setPendingListName(existingName);
  }, [activeListId, isRenamingListName, listMeta]);

  useEffect(() => {
    if (needsListSetup) {
      setSettingsOpen(false);
    }
  }, [needsListSetup]);

  useEffect(() => {
    if (!copyHint) return;
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => {
      setCopyHint(null);
    }, 1400);
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, [copyHint]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bounceAnim]);

  function generateInviteCode(length = 6) {
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < length; i += 1) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return code;
  }

  async function createSharedList() {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    if (!activeListId) return;

    const currentName =
      listMeta[activeListId]?.name || listNameInput.trim() || "Shared List";

    if (activeListId.startsWith("user:")) {
      let code = "";
      for (let attempt = 0; attempt < 5; attempt += 1) {
        code = generateInviteCode(6);
        const listRef = doc(db, "lists", code);
        const existing = await getDoc(listRef);
        if (!existing.exists()) {
          await setDoc(
            listRef,
            {
              code,
              createdBy: user.uid,
              createdAt: serverTimestamp(),
              shared: true,
              name: currentName,
            },
            { merge: true },
          );
          const personalItemsRef = collection(
            db,
            "users",
            user.uid,
            "shopping_items",
          );
          const snap = await getDocs(personalItemsRef);
          await Promise.all(
            snap.docs.map(
              (docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
                const data = docSnap.data() as { deleted?: boolean };
                if (data?.deleted) return Promise.resolve();
                return setDoc(
                  doc(db, "lists", code, "items", docSnap.id),
                  data,
                );
              },
            ),
          );
          await setDoc(
            userRef,
            {
              activeListId: code,
              listIds: arrayUnion(code),
            },
            { merge: true },
          );
          await updateDoc(userRef, { listIds: arrayRemove(activeListId) });
          setListMeta((prev) => {
            const next = { ...prev };
            delete next[activeListId];
            next[code] = { name: currentName, shared: true };
            return next;
          });
          setListNameInput("");
          setNotice(null);
          return;
        }
      }
      setNotice("Could not create a unique invite code. Try again.");
      return;
    }

    const listRef = doc(db, "lists", activeListId);
    const existing = await getDoc(listRef);
    const existingShared = existing.data()?.shared;
    if (existing.exists() && existingShared) {
      setNotice("This list is already shared.");
      return;
    }
    await setDoc(
      listRef,
      {
        code: activeListId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        shared: true,
        name: currentName,
      },
      { merge: true },
    );
    setListMeta((prev) => ({
      ...prev,
      [activeListId]: { name: currentName, shared: true },
    }));
    setNotice(null);
  }

  async function joinSharedList(rawCode: string) {
    const user = auth.currentUser;
    if (!user) return;
    const normalized = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!normalized) {
      setNotice("Enter a valid invite code.");
      return;
    }
    const listRef = doc(db, "lists", normalized);
    const snap = await getDoc(listRef);
    if (!snap.exists()) {
      setNotice("Invite code not found.");
      return;
    }
    const userRef = doc(db, "users", user.uid);
    await setDoc(
      userRef,
      { activeListId: normalized, listIds: arrayUnion(normalized) },
      { merge: true },
    );
    const listData = snap.data() as { name?: string; shared?: boolean };
    if (listData?.name || listData?.shared !== undefined) {
      setListMeta((prev) => ({
        ...prev,
        [normalized]: { name: listData.name, shared: listData.shared },
      }));
    }
    setShareCodeInput("");
    setNotice(null);
  }

  async function leaveSharedList() {
    const user = auth.currentUser;
    if (!user || !activeListId) return;
    setSettingsOpen(false);
    const userRef = doc(db, "users", user.uid);
    const fallback = listIds.find((id) => id !== activeListId) ?? null;
    await setDoc(
      userRef,
      {
        activeListId: fallback,
        listIds: arrayRemove(activeListId),
      },
      { merge: true },
    );
    if (listMeta[activeListId]?.shared) {
      const usersRef = collection(db, "users");
      const membersSnap = await getDocs(
        query(usersRef, where("listIds", "array-contains", activeListId)),
      );
      if (membersSnap.empty) {
        const itemsRef = collection(db, "lists", activeListId, "items");
        const itemsSnap = await getDocs(itemsRef);
        await Promise.all(
          itemsSnap.docs.map(
            (docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
              deleteDoc(docSnap.ref),
          ),
        );
        await deleteDoc(doc(db, "lists", activeListId));
      }
    }
    setNotice(null);
  }

  async function setActiveList(nextId: string) {
    const user = auth.currentUser;
    if (!user || !nextId) return;
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { activeListId: nextId }, { merge: true });
  }

  async function createPersonalList() {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const name = listNameInput.trim() || "My List";
    let code = "";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      code = generateInviteCode(6);
      const listRef = doc(db, "lists", code);
      const existing = await getDoc(listRef);
      if (!existing.exists()) {
        await setDoc(
          listRef,
          {
            code,
            name,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            shared: false,
          },
          { merge: true },
        );
        await setDoc(
          userRef,
          {
            activeListId: code,
            listIds: arrayUnion(code),
          },
          { merge: true },
        );
        setListMeta((prev) => ({ ...prev, [code]: { name, shared: false } }));
        setListNameInput("");
        setNotice(null);
        return;
      }
    }
    setNotice("Could not create a unique invite code. Try again.");
  }

  async function renameActiveList(nextName: string) {
    const user = auth.currentUser;
    if (!user || !activeListId) return;
    const name = nextName.trim();
    if (!name) return;
    const listRef = doc(db, "lists", activeListId);
    await setDoc(listRef, { name }, { merge: true });
    setListMeta((prev) => ({
      ...prev,
      [activeListId]: { name, shared: prev[activeListId]?.shared },
    }));
    setNotice(null);
  }

  async function commitListName() {
    if (!activeListId) {
      setIsRenamingListName(false);
      return;
    }
    const nextName = pendingListName.trim();
    const currentName = listMeta[activeListId]?.name ?? "";
    if (!nextName) {
      setPendingListName(currentName);
      setIsRenamingListName(false);
      return;
    }
    if (nextName !== currentName) {
      await renameActiveList(nextName);
    }
    setIsRenamingListName(false);
  }

  async function addToCurrent(match: Match, inputLabel?: string) {
    const item: Item = {
      id: normalizeLabel(inputLabel?.trim() || match.key),
      key: match.key,
      source: match.source,
      label: inputLabel?.trim() || match.key,
    };
    if (!item.label || !item.id) return;
    if (currentIds.has(item.id)) {
      setNotice(`"${item.label}" is already in your list`);
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    const itemsRef = getItemsCollectionRef(user.uid);
    const itemRef = doc(itemsRef, item.id);
    await setDoc(
      itemRef,
      {
        label: item.label,
        iconKey: item.key,
        status: "current",
        deleted: false,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
    setNotice(null);
    requestAnimationFrame(() => {
      currentListRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
  }

  async function movePastToCurrent(item: Item) {
    if (currentIds.has(item.id)) {
      setNotice(`"${item.label}" is already in your list`);
      return;
    }
    recentlyReaddedRef.current.add(item.id);
    const user = auth.currentUser;
    if (!user) return;
    const itemsRef = getItemsCollectionRef(user.uid);
    const itemRef = doc(itemsRef, item.id);
    await updateDoc(itemRef, {
      status: "current",
      deleted: false,
      updatedAt: serverTimestamp(),
    });
    setNotice(null);
    requestAnimationFrame(() => {
      currentListRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
  }

  async function moveToPast(item: Item) {
    if (pastIds.has(item.id)) return;
    const { base } = parseQuantity(item.label);
    const user = auth.currentUser;
    if (!user) return;
    const itemsRef = getItemsCollectionRef(user.uid);
    const itemRef = doc(itemsRef, item.id);
    await updateDoc(itemRef, {
      status: "past",
      label: base || item.label,
      lastUsedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  function parseQuantity(label: string) {
    const trimmed = label.trim();
    const match = trimmed.match(/\s+x(\d+)$/i);
    if (!match) {
      return { base: trimmed, qty: 1 };
    }
    const qty = Math.max(1, Number(match[1] ?? 1));
    const base = trimmed.replace(/\s+x\d+$/i, "").trim();
    return { base, qty };
  }

  async function updateQuantity(item: Item, nextQty: number) {
    const { base } = parseQuantity(item.label);
    if (!base) return;
    const newLabel = nextQty > 1 ? `${base} x${nextQty}` : base;
    if (newLabel === item.label) return;
    const user = auth.currentUser;
    if (!user) return;
    const itemsRef = getItemsCollectionRef(user.uid);
    const itemRef = doc(itemsRef, item.id);
    await updateDoc(itemRef, {
      label: newLabel,
      updatedAt: serverTimestamp(),
    });
  }

  function renderItem({
    item,
    onPress,
    onDelete,
    dimmed,
    showQuantity = true,
  }: {
    item: Item;
    onPress: (i: Item) => void;
    onDelete?: (i: Item) => void;
    dimmed?: boolean;
    showQuantity?: boolean;
  }) {
    const { qty, base } = parseQuantity(item.label);
    const rowContent = (
      <View
        style={[
          styles.row,
          { borderColor: c.card, backgroundColor: surfaceRow },
          dimmed && { opacity: dimmedOpacity },
        ]}
      >
        <Pressable
          onPress={() => onPress(item)}
          style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.7 }]}
        >
          <Image source={item.source} style={styles.rowIcon} />
          <Text
            style={[
              styles.rowText,
              { color: dimmed ? dimmedTextColor : c.text },
            ]}
          >
            {base}
          </Text>
        </Pressable>
        {showQuantity ? (
          <View style={styles.qtyControlRow}>
            {qty > 1 ? (
              <Pressable
                onPress={() => updateQuantity(item, Math.max(1, qty - 1))}
                style={({ pressed }) => [
                  styles.qtyButton,
                  {
                    borderColor: isDark
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.2)",
                    backgroundColor: isDark
                      ? "rgba(163,177,138,0.18)"
                      : "rgba(163,177,138,0.16)",
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.qtyButtonText,
                    {
                      color: isDark
                        ? "rgba(237,237,231,0.9)"
                        : "rgba(43,45,45,0.85)",
                    },
                  ]}
                >
                  -
                </Text>
              </Pressable>
            ) : null}
            <Text
              style={[
                styles.qtyValue,
                {
                  color: isDark
                    ? "rgba(237,237,231,0.9)"
                    : "rgba(43,45,45,0.85)",
                },
              ]}
            >
              {qty}
            </Text>
            <Pressable
              onPress={() =>
                updateQuantity(item, qty >= maxQuickQty ? 1 : qty + 1)
              }
              style={({ pressed }) => [
                styles.qtyButton,
                {
                  borderColor: isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.2)",
                  backgroundColor: isDark
                    ? "rgba(163,177,138,0.18)"
                    : "rgba(163,177,138,0.16)",
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text
                style={[
                  styles.qtyButtonText,
                  {
                    color: isDark
                      ? "rgba(237,237,231,0.9)"
                      : "rgba(43,45,45,0.85)",
                  },
                ]}
              >
                +
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );

    return (
      <Swipeable
        overshootRight={false}
        overshootLeft={false}
        friction={1}
        rightThreshold={24}
        leftThreshold={0}
        onSwipeableWillOpen={(direction) => {
          if (direction === "left") {
            onPress(item);
          }
        }}
        renderLeftActions={() => <View style={styles.moveActionSpacer} />}
        renderRightActions={() => (
          <View style={styles.deleteAction}>
            <Pressable
              onPress={() => onDelete?.(item)}
              style={({ pressed }) => [
                styles.deleteActionButton,
                {
                  backgroundColor: `${c.alert}33`,
                  borderColor: `${c.alert}66`,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialCommunityIcons name="close" size={12} color={c.alert} />
            </Pressable>
          </View>
        )}
      >
        {rowContent}
      </Swipeable>
    );
  }

  return (
    <View style={styles.container}>
      {!needsListSetup ? (
        <Animated.View
          style={[
            styles.listsWrapper,
            {
              paddingBottom: Math.max(searchDockHeight + keyboardLift + 12, 12),
              opacity: listDimOpacity,
            },
          ]}
          pointerEvents={keyboardVisible ? "none" : "auto"}
        >
          <View
            style={[
              styles.listHeaderCard,
              { backgroundColor: surfaceCard, borderColor: surfaceBorder },
            ]}
          >
            <View style={styles.listHeaderTop}>
              <Text style={[styles.listHeaderTitle, { color: c.text }]}>
                {activeListId ? getListLabel(activeListId) : "Your Lists"}
              </Text>
              <Pressable
                onPress={() => setSettingsOpen(true)}
                style={({ pressed }) => [
                  styles.shareIconButton,
                  { borderColor: surfaceBorder },
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="List settings"
              >
                <MaterialCommunityIcons
                  name="cog-outline"
                  size={16}
                  color={sectionMetaColor}
                />
              </Pressable>
            </View>
            <View style={styles.listHeaderRow}>
              {isSharedList ? (
                <>
                  <View style={styles.avatarRow}>
                    <View
                      style={[
                        styles.avatarCircle,
                        { backgroundColor: "rgba(163,177,138,0.35)" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="account"
                        size={14}
                        color={c.text}
                      />
                    </View>
                    <View
                      style={[
                        styles.avatarCircle,
                        { backgroundColor: "rgba(163,177,138,0.25)" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="account"
                        size={14}
                        color={c.text}
                      />
                    </View>
                    <View
                      style={[
                        styles.avatarCircle,
                        { backgroundColor: "rgba(163,177,138,0.2)" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="account"
                        size={14}
                        color={c.text}
                      />
                    </View>
                  </View>
                  <Text
                    style={[styles.listHeaderMeta, { color: sectionMetaColor }]}
                  >
                    Shared list
                  </Text>
                </>
              ) : (
                <Pressable
                  onPress={() => setSettingsOpen(true)}
                  style={({ pressed }) => [
                    styles.inviteOutline,
                    { borderColor: surfaceBorder },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-plus-outline"
                    size={14}
                    color={sectionMetaColor}
                  />
                  <Text
                    style={[styles.inviteText, { color: sectionMetaColor }]}
                  >
                    Invite friend
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.listSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>
                Groceries List
              </Text>
              <Text style={[styles.sectionMeta, { color: sectionMetaColor }]}>
                Swipe right if bought
              </Text>
            </View>
            <View
              style={[
                styles.card,
                styles.listCard,
                { backgroundColor: surfaceCard, borderColor: surfaceBorder },
              ]}
            >
              <FlatList
                ref={currentListRef}
                data={currentList}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) =>
                  renderItem({
                    item,
                    onPress: moveToPast,
                    onDelete: async (i) => {
                      const user = auth.currentUser;
                      if (!user) return;
                      const itemsRef = getItemsCollectionRef(user.uid);
                      const itemRef = doc(itemsRef, i.id);
                      await updateDoc(itemRef, {
                        deleted: true,
                        updatedAt: serverTimestamp(),
                      });
                    },
                  })
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator
                indicatorStyle="white"
                scrollEventThrottle={16}
                onScroll={(e) => {
                  const { layoutMeasurement, contentOffset, contentSize } =
                    e.nativeEvent;
                  const atEnd =
                    layoutMeasurement.height + contentOffset.y >=
                    contentSize.height - 4;
                  setCurrentAtEnd(atEnd);
                }}
              />
              <View
                pointerEvents="none"
                style={[styles.fadeTop, { backgroundColor: fadeColor }]}
              />
              <View
                pointerEvents="none"
                style={[styles.fadeBottom, { backgroundColor: fadeColor }]}
              />
              {currentList.length > 4 && !currentAtEnd ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.scrollHintOverlay,
                    {
                      opacity: bounceAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.6, 1],
                      }),
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.scrollHintPill,
                      {
                        backgroundColor: scrollPillBg,
                        borderColor: scrollPillBorder,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={16}
                      color={
                        isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.6)"
                      }
                    />
                    <Text
                      style={[
                        styles.scrollHintText,
                        { color: scrollTextColor },
                      ]}
                    >
                      Scroll
                    </Text>
                  </View>
                </Animated.View>
              ) : null}
            </View>
          </View>

          <View style={styles.listSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>
                Previous Items
              </Text>
              <Text style={[styles.sectionMeta, { color: sectionMetaColor }]}>
                Swipe right to re-add
              </Text>
            </View>
            <View
              style={[
                styles.card,
                styles.listCard,
                { backgroundColor: surfaceCard, borderColor: surfaceBorder },
              ]}
            >
              <FlatList
                data={pastList}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) =>
                  renderItem({
                    item,
                    onPress: movePastToCurrent,
                    dimmed: true,
                    showQuantity: false,
                    onDelete: async (i) => {
                      const user = auth.currentUser;
                      if (!user) return;
                      const itemsRef = getItemsCollectionRef(user.uid);
                      const itemRef = doc(itemsRef, i.id);
                      await updateDoc(itemRef, {
                        deleted: true,
                        updatedAt: serverTimestamp(),
                      });
                    },
                  })
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator
                indicatorStyle="white"
                scrollEventThrottle={16}
                onScroll={(e) => {
                  const { layoutMeasurement, contentOffset, contentSize } =
                    e.nativeEvent;
                  const atEnd =
                    layoutMeasurement.height + contentOffset.y >=
                    contentSize.height - 4;
                  setPastAtEnd(atEnd);
                }}
              />
              <View
                pointerEvents="none"
                style={[styles.fadeTop, { backgroundColor: fadeColor }]}
              />
              <View
                pointerEvents="none"
                style={[styles.fadeBottom, { backgroundColor: fadeColor }]}
              />
              {pastList.length > 4 && !pastAtEnd ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.scrollHintOverlay,
                    {
                      opacity: bounceAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.6, 1],
                      }),
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.scrollHintPill,
                      {
                        backgroundColor: scrollPillBg,
                        borderColor: scrollPillBorder,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={16}
                      color={
                        isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.6)"
                      }
                    />
                    <Text
                      style={[
                        styles.scrollHintText,
                        { color: scrollTextColor },
                      ]}
                    >
                      Scroll
                    </Text>
                  </View>
                </Animated.View>
              ) : null}
            </View>
          </View>
        </Animated.View>
      ) : null}

      {keyboardVisible ? (
        <Pressable
          style={styles.keyboardDismissOverlay}
          onPress={Keyboard.dismiss}
        />
      ) : null}

      {!needsListSetup ? (
        <View style={styles.searchDockWrapper} pointerEvents="box-none">
          <Animated.View
            style={[styles.searchDock, { bottom: keyboardOffsetAnim }]}
          >
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: isDark
                    ? surfaceHero
                    : "rgba(163,177,138,0.28)",
                  borderColor: isDark ? c.olive : "rgba(88,129,87,0.75)",
                  shadowOpacity: isDark ? styles.heroCard.shadowOpacity : 0,
                  elevation: isDark ? styles.heroCard.elevation : 0,
                },
              ]}
              onLayout={(e) => setSearchDockHeight(e.nativeEvent.layout.height)}
            >
              <Text style={[styles.cardTitle, { color: c.text }]}>
                Build your list
              </Text>
              <Text style={[styles.cardSubtitle, { color: subtitleColor }]}>
                Search and add items to your current list.
              </Text>
              {notice ? (
                <Text
                  style={[styles.notice, { color: "rgba(217,100,89,0.85)" }]}
                >
                  {notice}
                </Text>
              ) : null}
              {!activeUid ? (
                <Text
                  style={[styles.notice, { color: "rgba(217,100,89,0.85)" }]}
                >
                  Not signed in. Lists won’t load.
                </Text>
              ) : null}
              <FoodIconSearch
                onSubmit={addToCurrent}
                showPreview={false}
                variant={isDark ? "dark" : "light"}
                onFocus={() => {
                  const height =
                    lastKeyboardHeight.current || defaultKeyboardHeight;
                  setKeyboardOffset(height);
                  animateKeyboard(
                    height,
                    Platform.OS === "android" ? 140 : 180,
                  );
                }}
                onBlur={() => {
                  setKeyboardOffset(0);
                  animateKeyboard(0, Platform.OS === "android" ? 160 : 200);
                }}
              />
            </View>
          </Animated.View>
        </View>
      ) : null}

      <Modal
        transparent
        visible={settingsOpen && !needsListSetup}
        animationType="fade"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalBackdropPress}
            onPress={() => setSettingsOpen(false)}
          />
          <View
            style={[
              styles.modalCard,
              { backgroundColor: surfaceCard, borderColor: surfaceBorder },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>
                List settings
              </Text>
              <Pressable
                onPress={() => setSettingsOpen(false)}
                style={({ pressed }) => [
                  styles.modalClose,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={16}
                  color={sectionMetaColor}
                />
              </Pressable>
            </View>

            <View
              style={[
                styles.listPickerCard,
                {
                  borderColor: surfaceBorder,
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.04)",
                },
              ]}
            >
              <Text style={[styles.shareTitle, { color: c.text }]}>
                Your lists
              </Text>
              <View style={styles.listPickerWrap}>
                {listIds.map((id) => {
                  const isActive = id === activeListId;
                  return (
                    <Pressable
                      key={id}
                      onPress={() => setActiveList(id)}
                      style={({ pressed }) => [
                        styles.listPill,
                        {
                          borderColor: isActive ? c.olive : surfaceBorder,
                          backgroundColor: isActive
                            ? "rgba(163,177,138,0.22)"
                            : "transparent",
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.listPillText,
                          { color: isActive ? c.text : sectionMetaColor },
                        ]}
                      >
                        {getListLabel(id)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View
              style={[
                styles.shareCard,
                {
                  borderColor: surfaceBorder,
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(0,0,0,0.05)",
                },
              ]}
            >
              <View style={styles.renameInline}>
                <Text style={[styles.settingsSectionTitle, { color: c.text }]}>
                  List name
                </Text>
                <View style={styles.renameInputWrap}>
                  <TextInput
                    value={pendingListName}
                    onChangeText={setPendingListName}
                    onFocus={() => setIsRenamingListName(true)}
                    onBlur={() => {
                      setIsRenamingListName(false);
                      void commitListName();
                    }}
                    onSubmitEditing={() => {
                      void commitListName();
                    }}
                    placeholder="List name"
                    placeholderTextColor={sectionMetaColor}
                    autoCorrect={false}
                    returnKeyType="done"
                    style={[
                      styles.renameInput,
                      { color: c.text, borderColor: sectionMetaColor },
                    ]}
                  />
                  {pendingListName.length ? (
                    <Pressable
                      onPress={() => setPendingListName("")}
                      style={({ pressed }) => [
                        styles.renameClear,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={16}
                        color={sectionMetaColor}
                      />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <Text style={[styles.settingsSectionTitle, { color: c.text }]}>
                Sharing
              </Text>
              {isSharedList && activeListId ? (
                <>
                  <Text
                    style={[
                      styles.settingsSectionSubtitle,
                      { color: sectionMetaColor },
                    ]}
                  >
                    Currently shared with
                  </Text>
                  <View style={styles.memberRow}>
                    <View
                      style={[
                        styles.memberAvatar,
                        { backgroundColor: "rgba(163,177,138,0.22)" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="account"
                        size={14}
                        color={c.text}
                      />
                    </View>
                    <Text style={[styles.memberName, { color: c.text }]}>
                      You
                    </Text>
                    <Text
                      style={[styles.memberRole, { color: sectionMetaColor }]}
                    >
                      Admin
                    </Text>
                    <MaterialCommunityIcons
                      name="crown"
                      size={12}
                      color={sectionMetaColor}
                    />
                  </View>

                  <Text
                    style={[
                      styles.settingsSectionSubtitle,
                      { color: sectionMetaColor },
                    ]}
                  >
                    Share methods
                  </Text>
                  <View
                    style={[
                      styles.shareMethodsCard,
                      {
                        borderColor: surfaceBorder,
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(0,0,0,0.04)",
                      },
                    ]}
                  >
                    <Pressable
                      onPress={async () => {
                        if (!shareLink) return;
                        await Clipboard.setStringAsync(shareLink);
                        setCopyHint("link");
                      }}
                      style={({ pressed }) => [
                        styles.shareMethodRow,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="link-variant"
                        size={14}
                        color={sectionMetaColor}
                      />
                      <Text
                        style={[
                          styles.shareMethodText,
                          { color: subtitleColor },
                        ]}
                        numberOfLines={1}
                      >
                        Invite link
                      </Text>
                      <MaterialCommunityIcons
                        name="content-copy"
                        size={14}
                        color={sectionMetaColor}
                      />
                    </Pressable>
                    <View
                      style={[
                        styles.shareMethodDivider,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.12)"
                            : "rgba(0,0,0,0.08)",
                        },
                      ]}
                    />
                    <Pressable
                      onPress={async () => {
                        await Clipboard.setStringAsync(activeListId);
                        setCopyHint("code");
                      }}
                      style={({ pressed }) => [
                        styles.shareMethodRow,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="key-outline"
                        size={14}
                        color={sectionMetaColor}
                      />
                      <Text
                        style={[
                          styles.shareMethodText,
                          { color: subtitleColor },
                        ]}
                      >
                        Invite code: {activeListId}
                      </Text>
                      <MaterialCommunityIcons
                        name="content-copy"
                        size={14}
                        color={sectionMetaColor}
                      />
                    </Pressable>
                  </View>
                  {copyHint ? (
                    <Text
                      style={[styles.copyHint, { color: sectionMetaColor }]}
                    >
                      {copyHint === "code" ? "Code copied" : "Link copied"}
                    </Text>
                  ) : null}
                  <Pressable
                    onPress={leaveSharedList}
                    disabled={!activeUid || !activeListId}
                    style={({ pressed }) => [
                      styles.dangerButton,
                      pressed && { opacity: 0.7 },
                      (!activeUid || !activeListId) && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={styles.dangerButtonText}>Leave list</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text
                    style={[
                      styles.settingsSectionSubtitle,
                      { color: sectionMetaColor },
                    ]}
                  >
                    This list is private.
                  </Text>

                  <Pressable
                    onPress={createSharedList}
                    disabled={!activeUid}
                    style={({ pressed }) => [
                      styles.secondaryActionButton,
                      { borderColor: surfaceBorder },
                      pressed && { opacity: 0.7 },
                      !activeUid && { opacity: 0.5 },
                    ]}
                  >
                    <Text
                      style={[styles.secondaryActionText, { color: c.text }]}
                    >
                      Make shareable
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      if (!activeUid || !activeListId) return;
                      setSettingsOpen(false);
                      const userRef = doc(db, "users", activeUid);
                      const fallback =
                        listIds.find((id) => id !== activeListId) ?? null;
                      await setDoc(
                        userRef,
                        {
                          activeListId: fallback,
                          listIds: arrayRemove(activeListId),
                        },
                        { merge: true },
                      );
                      const itemsRef = collection(
                        db,
                        "lists",
                        activeListId,
                        "items",
                      );
                      const itemsSnap = await getDocs(itemsRef);
                      await Promise.all(
                        itemsSnap.docs.map(
                          (docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
                            deleteDoc(docSnap.ref),
                        ),
                      );
                      await deleteDoc(doc(db, "lists", activeListId));
                      setNotice(null);
                    }}
                    disabled={!activeUid || !activeListId}
                    style={({ pressed }) => [
                      styles.dangerOutlineButton,
                      pressed && { opacity: 0.7 },
                      (!activeUid || !activeListId) && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={styles.dangerOutlineText}>Delete list</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={needsListSetup}
        animationType="fade"
        onRequestClose={() => null}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: surfaceCard, borderColor: surfaceBorder },
            ]}
          >
            <Text style={[styles.modalTitle, { color: c.text }]}>
              Create or join a list
            </Text>
            <Text style={[styles.shareLine, { color: subtitleColor }]}>
              You need a list before you can add items.
            </Text>

            <View
              style={[
                styles.renameCard,
                styles.setupCreateCard,
                {
                  borderColor: surfaceBorder,
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(88,129,87,0.08)",
                },
              ]}
            >
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={16}
                  color={sectionMetaColor}
                />
                <Text style={[styles.shareTitle, { color: c.text }]}>
                  New list name
                </Text>
              </View>
              <TextInput
                value={listNameInput}
                onChangeText={setListNameInput}
                placeholder="My List"
                placeholderTextColor={sectionMetaColor}
                autoCorrect={false}
                maxLength={32}
                style={[
                  styles.shareInput,
                  {
                    color: c.text,
                    borderColor: surfaceBorder,
                  },
                ]}
              />
              <Pressable
                onPress={createPersonalList}
                disabled={!activeUid}
                style={({ pressed }) => [
                  styles.primaryActionButton,
                  { backgroundColor: c.primary },
                  pressed && { opacity: 0.7 },
                  !activeUid && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.primaryActionText}>Create list</Text>
              </Pressable>
            </View>

            <View style={styles.orDividerRow}>
              <View
                style={[
                  styles.orDividerLine,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(0,0,0,0.08)",
                  },
                ]}
              />
              <Text style={[styles.orDividerText, { color: sectionMetaColor }]}>
                or
              </Text>
              <View
                style={[
                  styles.orDividerLine,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(0,0,0,0.08)",
                  },
                ]}
              />
            </View>

            <View
              style={[
                styles.renameCard,
                styles.setupJoinCard,
                {
                  borderColor: surfaceBorder,
                  backgroundColor: isDark
                    ? "rgba(0,0,0,0.16)"
                    : "rgba(88,129,87,0.12)",
                },
              ]}
            >
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons
                  name="link-variant"
                  size={16}
                  color={sectionMetaColor}
                />
                <Text style={[styles.shareTitle, { color: c.text }]}>
                  Join with code
                </Text>
              </View>
              <View style={styles.shareJoinRow}>
                <TextInput
                  value={shareCodeInput}
                  onChangeText={setShareCodeInput}
                  placeholder="Invite code"
                  placeholderTextColor={sectionMetaColor}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={10}
                  style={[
                    styles.shareInput,
                    styles.shareInputRow,
                    {
                      color: c.text,
                      borderColor: surfaceBorder,
                    },
                  ]}
                />
                <Pressable
                  onPress={() => joinSharedList(shareCodeInput)}
                  disabled={!activeUid}
                  style={({ pressed }) => [
                    styles.secondaryActionButton,
                    { borderColor: surfaceBorder },
                    pressed && { opacity: 0.7 },
                    !activeUid && { opacity: 0.5 },
                  ]}
                >
                  <Text style={[styles.secondaryActionText, { color: c.text }]}>
                    Join
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 16,
    paddingHorizontal: 20,
    flex: 1,
    position: "relative",
  },
  listsWrapper: {
    gap: 16,
    flex: 1,
    marginTop: "10%",
    position: "relative",
  },
  searchDockWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 20,
  },
  keyboardDismissOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
  },
  searchDock: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 0,
  },
  heroCard: {
    backgroundColor: "rgba(16,16,16,0.92)",
    borderRadius: 24,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  card: {
    backgroundColor: "rgba(18,18,18,0.88)",
    borderRadius: 20,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  listCard: {
    maxHeight: 250,
    minHeight: 120,
    position: "relative",
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: "Montserrat-SemiBold",
  },
  cardSubtitle: {
    marginTop: -10,
    fontFamily: "Montserrat-Regular",
    fontSize: 13,
  },
  listSection: {
    width: "100%",
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  listHeaderCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 10,
  },
  listHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  listHeaderTitle: {
    fontSize: 22,
    fontFamily: "Montserrat-SemiBold",
  },
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listHeaderMeta: {
    fontSize: 11,
    fontFamily: "Montserrat-Medium",
  },
  shareIconButton: {
    borderWidth: 1,
    borderRadius: 999,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: -6,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  inviteOutline: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inviteText: {
    fontSize: 11,
    fontFamily: "Montserrat-SemiBold",
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Montserrat-SemiBold",
    marginBottom: -10,
  },
  sectionMeta: {
    fontSize: 10,
    fontFamily: "Montserrat-Regular",
    marginBottom: -10,
  },
  listContent: {
    gap: 10,
  },
  fadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 14,
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 16,
  },
  scrollHintOverlay: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 8,
    alignItems: "center",
  },
  scrollHintPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  scrollHintText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Montserrat-SemiBold",
  },
  notice: {
    fontSize: 12,
    paddingHorizontal: 6,
    textAlign: "center",
    alignSelf: "center",
    width: "100%",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalBackdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "Montserrat-SemiBold",
  },
  modalClose: {
    padding: 4,
  },
  shareCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  listPickerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  renameCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  setupCreateCard: {
    gap: 12,
  },
  setupJoinCard: {
    gap: 12,
  },
  renameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listPickerWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  listPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  listPillText: {
    fontSize: 11,
    fontFamily: "Montserrat-SemiBold",
  },
  shareHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shareTitle: {
    fontSize: 14,
    fontFamily: "Montserrat-SemiBold",
  },
  shareMeta: {
    fontSize: 11,
    fontFamily: "Montserrat-Regular",
  },
  settingsSectionTitle: {
    fontSize: 15,
    fontFamily: "Montserrat-SemiBold",
  },
  settingsSectionSubtitle: {
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
  },
  renameInline: {
    gap: 6,
    marginBottom: 12,
  },
  renameInputWrap: {
    position: "relative",
  },
  renameInput: {
    fontSize: 15,
    fontFamily: "Montserrat-SemiBold",
    paddingVertical: 6,
    paddingRight: 24,
    borderBottomWidth: 1,
  },
  renameClear: {
    position: "absolute",
    right: 0,
    top: 6,
  },
  shareLine: {
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
  },
  shareLinkRow: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  shareLinkText: {
    fontSize: 12,
    fontFamily: "Montserrat-Medium",
    flex: 1,
  },
  copyHint: {
    fontSize: 11,
    fontFamily: "Montserrat-SemiBold",
    textAlign: "right",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  memberName: {
    fontSize: 12,
    fontFamily: "Montserrat-SemiBold",
  },
  memberRole: {
    fontSize: 11,
    fontFamily: "Montserrat-Regular",
  },
  shareMethodsCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  shareMethodRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  shareMethodText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Montserrat-Medium",
  },
  shareMethodDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  shareJoinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shareInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 0,
    height: 40,
    width: "100%",
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: "center",
    fontFamily: "Montserrat-Medium",
  },
  shareInputRow: {
    flex: 1,
    width: "auto",
  },
  primaryActionButton: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryActionText: {
    fontSize: 13,
    fontFamily: "Montserrat-SemiBold",
    color: "rgba(12,12,12,0.9)",
  },
  secondaryActionButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  secondaryActionText: {
    fontSize: 12,
    fontFamily: "Montserrat-SemiBold",
  },
  dangerButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "rgba(217,100,89,0.85)",
  },
  dangerButtonText: {
    fontSize: 13,
    fontFamily: "Montserrat-SemiBold",
    color: "#fff",
  },
  dangerOutlineButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderColor: "rgba(217,100,89,0.6)",
  },
  dangerOutlineText: {
    fontSize: 12,
    fontFamily: "Montserrat-SemiBold",
    color: "rgba(217,100,89,0.9)",
  },
  orDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  orDividerText: {
    fontSize: 11,
    fontFamily: "Montserrat-SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  shareButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  shareButtonSmall: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  shareButtonText: {
    fontSize: 12,
    fontFamily: "Montserrat-SemiBold",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  rowIcon: {
    width: 24,
    height: 24,
  },
  rowText: {
    fontSize: 14,
    textTransform: "capitalize",
  },
  qtyControlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: 8,
  },
  qtyButton: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonText: {
    fontSize: 14,
    fontFamily: "Montserrat-Medium",
  },
  qtyValue: {
    fontSize: 12,
    fontFamily: "Montserrat-SemiBold",
    minWidth: 16,
    textAlign: "center",
  },
  moveActionSpacer: {
    width: 72,
  },
  deleteAction: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteActionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
