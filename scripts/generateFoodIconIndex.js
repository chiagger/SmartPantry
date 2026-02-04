/* eslint-env node */
/* eslint-disable no-undef */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const iconDir = path.join(root, "assets", "images", "food-icons");
const outFile = path.join(root, "utils", "foodIconIndex.ts");

const files = fs
  .readdirSync(iconDir)
  .filter((f) => f.endsWith(".png"))
  .sort((a, b) => a.localeCompare(b));

const entries = files.map((file) => {
  const name = file.replace(/\.png$/i, "");
  const rel = `../assets/images/food-icons/${file}`;
  return `  "${name}": require("${rel}"),`;
});

const header = `// AUTO-GENERATED FILE. DO NOT EDIT.\n// Run: node scripts/generateFoodIconIndex.js\n\n`;
const body = `export const FOOD_ICON_INDEX: Record<string, number> = {\n${entries.join(
  "\n"
)}\n};\n`;

fs.writeFileSync(outFile, header + body, "utf8");

console.log(`Wrote ${files.length} icons to ${path.relative(root, outFile)}`);
