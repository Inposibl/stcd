export const ENV_ALIASES = Object.freeze({
  "NF/NT": "The Idea Lab",
  "NT/STJ": "The Performance Arena",
  "NT/STP": "The Disruption Lab",
  "NF/SFJ": "The Mission Field",
  "NF/SFP": "The Creative Commons",
  "SFJ/SFP": "The Hometown Network",
  "SFP/SFJ": "The Franchise Machine",
  "STJ/STP": "The Power Racket",
  "STP/STJ": "The Enforcer Network",
} as const);

export type EnvironmentCode = keyof typeof ENV_ALIASES;
const LEGACY_FRANCHISE_CODE = ["SP", "SJ"].join("/");

const PUBLIC_ENVIRONMENT_ALIASES = Object.freeze({
  ...ENV_ALIASES,
  [LEGACY_FRANCHISE_CODE]: "The Franchise Machine",
} as const);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function environmentCodePattern(code: string): RegExp {
  const pattern = code
    .split("/")
    .map(escapeRegExp)
    .join("\\s*[/_-]\\s*");
  return new RegExp(`(^|[^A-Z0-9])(${pattern})(?![A-Z0-9])`, "g");
}

export function environmentAlias(code: string): string {
  const normalized = String(code ?? "").trim();
  return ENV_ALIASES[normalized as EnvironmentCode] ?? replaceEnvironmentCodes(normalized);
}

export function replaceEnvironmentCodes(value: string): string {
  let text = String(value ?? "");
  for (const [code, alias] of Object.entries(PUBLIC_ENVIRONMENT_ALIASES).sort(
    ([left], [right]) => right.length - left.length,
  )) {
    text = text.replace(environmentCodePattern(code), (_match, prefix) => `${prefix}${alias}`);
  }
  return text;
}

export function stripSourceDocumentReferences(value: string): string {
  return String(value ?? "")
    .replace(/\bSource document:\s*[^\n]*?\.docx\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function publicSafeText(value: string): string {
  return replaceEnvironmentCodes(stripSourceDocumentReferences(value));
}

export function containsInternalEnvironmentCode(value: string): boolean {
  const text = String(value ?? "");
  return Object.keys(PUBLIC_ENVIRONMENT_ALIASES).some((code) => environmentCodePattern(code).test(text));
}
