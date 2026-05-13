import { readFileSync, writeFileSync } from "node:fs";

const sourceUrl = new URL("../src/generated/newlogic/questionnaires.json", import.meta.url);
const targetUrl = new URL("../src/generated/newlogic/publicQuestionnaires.json", import.meta.url);

const INTERNAL_FILE_PATTERN = /\bST_[A-Za-z0-9_ -]+\.(?:xlsx|docx)\b/g;
const DROPPED_METADATA_KEYS = new Set([
  "sourceWorkbook",
  "sourceSheet",
  "sourceRow",
  "typeAllowedValues",
  "validation",
]);

function sanitize(value) {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !DROPPED_METADATA_KEYS.has(key))
        .map(([key, nestedValue]) => [key, sanitize(nestedValue)]),
    );
  }

  if (typeof value === "string") {
    return value
      .replace(INTERNAL_FILE_PATTERN, "internal source")
      .replace(/\bPer internal source\s*§\d+,?\s*/g, "")
      .replace(/\binternal source\b/g, "internal reference");
  }

  return value;
}

const source = JSON.parse(readFileSync(sourceUrl, "utf8"));
writeFileSync(targetUrl, `${JSON.stringify(sanitize(source), null, 2)}\n`);
