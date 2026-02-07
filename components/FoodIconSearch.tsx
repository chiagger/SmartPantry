import { useMemo, useState } from "react";
import { Image, StyleSheet, Text, TextInput, View } from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { FOOD_ICON_ALIASES } from "@/utils/foodIconAliases";
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

function stemToken(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.endsWith("es")) return token.slice(0, -2);
  if (token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((t) => stemToken(t));
}

function normalize(input: string): string[] {
  return tokenize(input);
}

function expandTokens(tokens: string[]): string[] {
  const out = new Set<string>();
  for (const token of tokens) {
    out.add(token);
    const alias = SYNONYMS[token];
    if (alias) {
      for (const a of alias) out.add(stemToken(a));
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

function scoreCandidate(queryTokens: string[], key: string): number {
  if (!queryTokens.length) return 0;
  const aliasTokens = FOOD_ICON_ALIASES[key] ?? [];
  const keyTokens = [
    ...key.split("-").map((t) => stemToken(t)),
    ...aliasTokens.flatMap((t) => tokenize(t)),
  ];
  const expanded = expandTokens(queryTokens);

  let score = 0;

  for (const q of expanded) {
    for (const k of keyTokens) {
      if (k === q) {
        score += 5;
        continue;
      }
      if (k.startsWith(q) || q.startsWith(k)) {
        score += 2;
        continue;
      }
      if (k.includes(q) || q.includes(k)) {
        score += 1;
        continue;
      }
      const distance = Math.min(3, levenshtein(q, k));
      if (distance === 1) score += 1;
      if (distance === 2) score += 0.5;
    }
  }

  return score;
}

function findBestMatch(input: string): Match {
  const queryTokens = normalize(input);
  if (!queryTokens.length) {
    return { key: DEFAULT_ICON, source: FOOD_ICON_INDEX[DEFAULT_ICON] };
  }
  const directKey = queryTokens.join("-");
  const aliasKey = DIRECT_ALIASES[directKey];
  if (aliasKey && FOOD_ICON_INDEX[aliasKey]) {
    return { key: aliasKey, source: FOOD_ICON_INDEX[aliasKey] };
  }
  if (directKey && FOOD_ICON_INDEX[directKey]) {
    return { key: directKey, source: FOOD_ICON_INDEX[directKey] };
  }
  let bestKey = DEFAULT_ICON;
  let bestScore = -1;

  for (const key of ICON_KEYS) {
    const score = scoreCandidate(queryTokens, key);
    if (score > bestScore) {
      bestScore = score;
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

  return { key: bestKey, source: FOOD_ICON_INDEX[bestKey] };
}

type FoodIconSearchProps = {
  onSubmit?: (match: Match, inputLabel: string) => void;
  showPreview?: boolean;
  variant?: "dark" | "green" | "light";
};

export default function FoodIconSearch({
  onSubmit,
  showPreview = true,
  variant = "dark",
}: FoodIconSearchProps) {
  const { colors: c } = useTheme();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
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
            borderColor: "rgba(88,129,87,0.55)",
            textColor: c.text,
            placeholder: "rgba(40,60,40,0.55)",
          }
        : {
            backgroundColor: "rgba(255,255,255,0.08)",
            borderColor: "rgba(255,255,255,0.2)",
            textColor: c.text,
            placeholder: c.icon,
          };

  const match = useMemo(() => findBestMatch(submittedQuery), [submittedQuery]);

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
          placeholder="Search for a food item"
          placeholderTextColor={inputTheme.placeholder}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => {
            const next = query.trim();
            setSubmittedQuery(next);
            if (onSubmit) onSubmit(findBestMatch(next), next);
            setQuery("");
          }}
          underlineColorAndroid="transparent"
          style={[styles.inputText, { color: inputTheme.textColor }]}
          selectionColor={inputTheme.textColor}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>
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
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 8,
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
