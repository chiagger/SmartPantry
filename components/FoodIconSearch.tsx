import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { AppLanguage } from "@/constants/i18n";
import { useTheme } from "@/context/ThemeContext";
import { FOOD_ICON_ALIASES } from "@/utils/foodIconAliases";
import { FOOD_ICON_ALIASES_IT } from "@/utils/foodIconAliasesIt";
import { FOOD_ICON_INDEX } from "@/utils/foodIconIndex";

export type Match = {
  key: string;
  source: number;
};

const ICON_KEYS = Object.keys(FOOD_ICON_INDEX);

const DEFAULT_ICON = "cheese";

const DIRECT_ALIASES: Record<string, string> = {
  apple: "red-apple",
  onion: "yellow-onion",
  oil: "olive-oil",
  radish: "daikon-radish",
  "red-lentil": "split-red-lentil-masoor-dal",
  "red-lentils": "split-red-lentil-masoor-dal",
  "tuna-can": "tuna-steak-raw",
  "canned-tuna": "tuna-steak-raw",
  cereal: "oats",
};

const SYNONYMS: Record<string, string[]> = {
  soda: ["soft", "drink", "cola"],
  pop: ["soft", "drink", "cola"],
  chips: ["crisps"],
  fries: ["french", "fries"],
  ketchup: ["catsup"],
  cilantro: ["coriander"],
  scallion: ["green", "onion"],
  springonion: ["green", "onion"],
  garbanzo: ["chickpeas"],
  aubergine: ["eggplant"],
  courgette: ["zucchini"],
  capsicum: ["bell", "pepper"],
  chilli: ["chili"],
  yoghurt: ["yogurt"],
  mince: ["ground"],
};

const ITALIAN_EQUIVALENTS: Record<string, string[]> = {
  uovo: ["uova"],
  uova: ["uovo"],
};

function stemToken(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.endsWith("es")) return token.slice(0, -2);
  if (token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function stripDiacritics(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/’|`/g, "'")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((t) => stemToken(t));
}

function normalize(input: string): string[] {
  return tokenize(stripDiacritics(input));
}

function expandTokens(tokens: string[], language: AppLanguage): string[] {
  const out = new Set<string>();
  for (const token of tokens) {
    out.add(token);
    if (language === "en") {
      const alias = SYNONYMS[token];
      if (alias) {
        for (const a of alias) out.add(stemToken(a));
      }
    } else if (language === "it") {
      const equivalents = ITALIAN_EQUIVALENTS[token];
      if (equivalents) {
        for (const equivalent of equivalents) out.add(stemToken(equivalent));
      }
    }
  }
  return Array.from(out);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const rows = new Array(b.length + 1);
  for (let i = 0; i <= b.length; i++) rows[i] = i;

  for (let i = 0; i < a.length; i++) {
    let prev = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      const next = Math.min(rows[j + 1] + 1, prev + 1, rows[j] + cost);
      rows[j] = prev;
      prev = next;
    }
    rows[b.length] = prev;
  }
  return rows[b.length];
}

type CandidateScore = {
  score: number;
  strongHits: number;
};

function scoreCandidate(
  queryTokens: string[],
  key: string,
  language: AppLanguage
): CandidateScore {
  if (!queryTokens.length) return { score: 0, strongHits: 0 };
  const aliasTokens =
    language === "it"
      ? (FOOD_ICON_ALIASES_IT[key] ?? [])
      : [...(FOOD_ICON_ALIASES[key] ?? []), ...(FOOD_ICON_ALIASES_IT[key] ?? [])];
  const aliasTokenLists = aliasTokens
    .map((alias) => tokenize(alias))
    .filter((parts) => parts.length > 0);

  const keyTokens = new Set<string>();
  if (language === "en") {
    for (const token of key.split("-").map((t) => stemToken(t))) {
      if (token.length > 1) {
        keyTokens.add(token);
      }
    }
  }
  for (const aliasParts of aliasTokenLists) {
    for (const token of aliasParts) {
      if (token.length > 1) {
        keyTokens.add(token);
      }
    }
  }

  const expanded = expandTokens(queryTokens, language);
  const normalizedQuery = queryTokens.join("-");

  let score = 0;
  let strongHits = 0;

  const hasExactAlias = aliasTokenLists.some(
    (parts) => parts.join("-") === normalizedQuery
  );
  if (hasExactAlias) {
    score += 12;
    strongHits += 2;
  } else if (
    queryTokens.length === 1 &&
    aliasTokenLists.some((parts) => parts[0] === queryTokens[0])
  ) {
    // Prefer icons whose localized alias starts with the searched noun.
    score += 3;
    strongHits += 1;
  }

  for (const q of expanded) {
    if (q.length < 2) continue;
    for (const k of keyTokens) {
      if (k === q) {
        score += 5;
        strongHits += 1;
        continue;
      }
      if (
        k.length >= 3 &&
        q.length >= 3 &&
        (k.startsWith(q) || q.startsWith(k))
      ) {
        score += 2;
        continue;
      }
      if (k.length >= 4 && q.length >= 4 && (k.includes(q) || q.includes(k))) {
        score += 1;
        continue;
      }
      if (k.length >= 3 && q.length >= 3) {
        const distance = Math.min(3, levenshtein(q, k));
        if (distance === 1) {
          score += 1;
        }
        if (distance === 2) {
          score += 0.5;
        }
      }
    }
  }

  return { score, strongHits };
}

function findBestMatch(input: string, language: AppLanguage): Match {
  const queryTokens = normalize(input);
  if (!queryTokens.length) {
    return { key: DEFAULT_ICON, source: FOOD_ICON_INDEX[DEFAULT_ICON] };
  }
  const directKey = queryTokens.join("-");
  if (language === "en") {
    const aliasKey = DIRECT_ALIASES[directKey];
    if (aliasKey && FOOD_ICON_INDEX[aliasKey]) {
      return { key: aliasKey, source: FOOD_ICON_INDEX[aliasKey] };
    }
    if (directKey && FOOD_ICON_INDEX[directKey]) {
      return { key: directKey, source: FOOD_ICON_INDEX[directKey] };
    }
  }
  let bestKey = DEFAULT_ICON;
  let bestScore = -1;
  let bestStrongHits = 0;

  for (const key of ICON_KEYS) {
    const { score, strongHits } = scoreCandidate(queryTokens, key, language);
    if (score > bestScore) {
      bestScore = score;
      bestStrongHits = strongHits;
      bestKey = key;
      continue;
    }
    if (score === bestScore && score > 0) {
      const currentLen = bestKey.split("-").length;
      const candidateLen = key.split("-").length;
      if (candidateLen < currentLen) {
        bestKey = key;
      }
    }
  }

  const isMultiTokenQuery = queryTokens.length >= 2;
  const hasStrongHit = bestStrongHits > 0;
  const minScore = isMultiTokenQuery ? 2 : 3;
  if (bestScore < minScore || (isMultiTokenQuery && !hasStrongHit)) {
    return { key: DEFAULT_ICON, source: FOOD_ICON_INDEX[DEFAULT_ICON] };
  }

  return { key: bestKey, source: FOOD_ICON_INDEX[bestKey] };
}

type FoodIconSearchProps = {
  onSubmit?: (match: Match, inputLabel: string) => void;
  showPreview?: boolean;
  variant?: "dark" | "green" | "light";
  onFocus?: () => void;
  onBlur?: () => void;
};

export default function FoodIconSearch({
  onSubmit,
  showPreview = true,
  variant = "dark",
  onFocus,
  onBlur,
}: FoodIconSearchProps) {
  const { colors: c, t, language } = useTheme();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isFocused, setIsFocused] = useState(false);
  const inputTheme =
    variant === "green"
      ? {
          backgroundColor: "rgba(0,0,0,0.18)",
          borderColor: "rgba(0,0,0,0.35)",
          textColor: "rgba(12,12,12,0.9)",
          placeholder: "rgba(12,12,12,0.6)",
        }
      : variant === "light"
        ? {
            backgroundColor: "#FFFFFF",
            borderColor: "rgba(88,129,87,0.75)",
            textColor: c.text,
            placeholder: "rgba(40,60,40,0.65)",
          }
        : {
            backgroundColor: "rgba(255,255,255,0.08)",
            borderColor: "rgba(255,255,255,0.2)",
            textColor: c.text,
            placeholder: c.icon,
          };

  const match = useMemo(
    () => findBestMatch(submittedQuery, language),
    [submittedQuery, language]
  );
  const isLight = variant === "light";
  const qtyTheme = {
    backgroundColor: isLight ? "#ffffff" : "rgba(0,0,0,0.25)",
    borderColor: isLight ? "rgba(88,129,87,0.6)" : "rgba(255,255,255,0.2)",
    textColor: isLight ? "rgba(43,45,45,0.9)" : "rgba(237,237,231,0.9)",
  };
  const handleSubmit = () => {
    if (!onSubmit) return;
    const baseLabel = query.trim();
    if (!baseLabel) return;
    const nextLabel = quantity > 1 ? `${baseLabel} x${quantity}` : baseLabel;
    setSubmittedQuery(baseLabel);
    onSubmit(findBestMatch(baseLabel, language), nextLabel);
    setQuery("");
    setQuantity(1);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputShell,
          {
            borderColor: inputTheme.borderColor,
            backgroundColor: inputTheme.backgroundColor,
          },
        ]}
      >
        <TextInput
          placeholder={t("food_search_placeholder")}
          placeholderTextColor={inputTheme.placeholder}
          value={query}
          onChangeText={setQuery}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          onSubmitEditing={() => {
            handleSubmit();
          }}
          underlineColorAndroid="transparent"
          style={[styles.inputText, { color: inputTheme.textColor }]}
          selectionColor={inputTheme.textColor}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => setQuery("")}
            accessibilityRole="button"
            accessibilityLabel={t("food_search_clear_search")}
            style={({ pressed }) => [
              styles.clearButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.clearText, { color: inputTheme.textColor }]}>
              ×
            </Text>
          </Pressable>
        ) : null}
      </View>
      {isFocused ? (
        <View style={styles.qtyControlRow}>
          <Pressable
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            style={({ pressed }) => [
              styles.qtyButton,
              {
                borderColor: qtyTheme.borderColor,
                backgroundColor: qtyTheme.backgroundColor,
                opacity: quantity <= 1 ? 0.4 : 1,
              },
              pressed && quantity > 1 && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.qtyButtonText, { color: qtyTheme.textColor }]}>
              -
            </Text>
          </Pressable>
          <Text style={[styles.qtyValue, { color: qtyTheme.textColor }]}>
            {quantity}
          </Text>
          <Pressable
            onPress={() => setQuantity((q) => Math.min(20, q + 1))}
            style={({ pressed }) => [
              styles.qtyButton,
              {
                borderColor: qtyTheme.borderColor,
                backgroundColor: qtyTheme.backgroundColor,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.qtyButtonText, { color: qtyTheme.textColor }]}>
              +
            </Text>
          </Pressable>
        </View>
      ) : null}
      {showPreview ? (
        <>
          <Image source={match.source} style={styles.icon} />
          <Text style={[styles.label, { color: c.text }]}>{match.key}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "stretch",
    gap: 16,
    paddingHorizontal: 0,
  },
  inputShell: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 50,
    justifyContent: "center",
  },
  inputText: {
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingRight: 40,
  },
  clearButton: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: {
    fontSize: 20,
    lineHeight: 20,
    fontFamily: "Montserrat-SemiBold",
  },
  qtyControlRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  qtyButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonText: {
    fontSize: 18,
    fontFamily: "Montserrat-Medium",
  },
  qtyValue: {
    fontSize: 14,
    fontFamily: "Montserrat-SemiBold",
    minWidth: 22,
    textAlign: "center",
  },
  icon: {
    width: 96,
    height: 96,
  },
  label: {
    fontSize: 14,
    textTransform: "capitalize",
  },
});
