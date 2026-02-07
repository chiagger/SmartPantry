import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Image,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
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
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "@react-native-firebase/firestore";
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
  const surfaceCard = isDark
    ? "rgba(18,18,18,0.88)"
    : "rgba(255,255,255,0.96)";
  const surfaceHero = isDark
    ? "rgba(16,16,16,0.92)"
    : "rgba(255,255,255,0.98)";
  const surfaceRow = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const surfaceBorder = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(0,0,0,0.12)";
  const fadeColor = isDark
    ? "rgba(18,18,18,0.9)"
    : "rgba(255,255,255,0.95)";
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
    let unsubCurrent: (() => void) | undefined;
    let unsubPast: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setActiveUid(user?.uid ?? null);
      if (unsubCurrent) {
        unsubCurrent();
        unsubCurrent = undefined;
      }
      if (unsubPast) {
        unsubPast();
        unsubPast = undefined;
      }

      if (!user) {
        setCurrentList([]);
        setPastList([]);
        return;
      }

      const itemsRef = collection(db, "users", user.uid, "shopping_items");
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

      unsubCurrent = onSnapshot(
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
              .map((entry) => entry.item);
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

      unsubPast = onSnapshot(
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
    });

    return () => {
      unsubAuth();
      if (unsubCurrent) unsubCurrent();
      if (unsubPast) unsubPast();
    };
  }, []);

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

    const itemRef = doc(db, "users", user.uid, "shopping_items", item.id);
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
    const itemRef = doc(db, "users", user.uid, "shopping_items", item.id);
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
    const itemRef = doc(db, "users", user.uid, "shopping_items", item.id);
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
    const itemRef = doc(db, "users", user.uid, "shopping_items", item.id);
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
                    const itemRef = doc(
                      db,
                      "users",
                      user.uid,
                      "shopping_items",
                      i.id,
                    );
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
                    color={isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.6)"}
                  />
                  <Text
                    style={[styles.scrollHintText, { color: scrollTextColor }]}
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
                    const itemRef = doc(
                      db,
                      "users",
                      user.uid,
                      "shopping_items",
                      i.id,
                    );
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
                    color={isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.6)"}
                  />
                  <Text
                    style={[styles.scrollHintText, { color: scrollTextColor }]}
                  >
                    Scroll
                  </Text>
                </View>
              </Animated.View>
            ) : null}
          </View>
        </View>
      </Animated.View>

      {keyboardVisible ? (
        <Pressable
          style={styles.keyboardDismissOverlay}
          onPress={Keyboard.dismiss}
        />
      ) : null}

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
              <Text style={[styles.notice, { color: "rgba(217,100,89,0.85)" }]}>
                {notice}
              </Text>
            ) : null}
            {!activeUid ? (
              <Text style={[styles.notice, { color: "rgba(217,100,89,0.85)" }]}>
                Not signed in. Lists won’t load.
              </Text>
            ) : null}
          <FoodIconSearch
            onSubmit={addToCurrent}
            showPreview={false}
            variant={isDark ? "dark" : "light"}
            onFocus={() => {
              const height = lastKeyboardHeight.current || defaultKeyboardHeight;
              setKeyboardOffset(height);
              animateKeyboard(height, Platform.OS === "android" ? 140 : 180);
            }}
            onBlur={() => {
              setKeyboardOffset(0);
              animateKeyboard(0, Platform.OS === "android" ? 160 : 200);
            }}
          />
          </View>
        </Animated.View>
      </View>
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
