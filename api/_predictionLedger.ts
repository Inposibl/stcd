import { createHash, randomUUID } from "node:crypto";

export const PREDICTION_LEDGER_WORKBOOK = "ST_Prediction_Ledger_v1.xlsx";
export const PREDICTION_LEDGER_SHEET = "SEALED_PREDICTIONS";
export const PREDICTION_LEDGER_STATUS = "SEALED";

export const PREDICTION_LEDGER_HEADERS = Object.freeze([
  "Deal ID",
  "ECS Pair\n(acq x tgt)",
  "Primary\nActor Type",
  "Dom.\nFunction",
  "Prediction 1\n(First signal - code + context + week window)",
  "Prediction 2\n(Transition rate - central + CB range)",
  "Prediction 3\n(Departure window)",
  "Falsification condition\n(what would falsify Prediction 2)",
  "Sealed\n(timestamp)",
  "Status",
  "Seal Hash",
  "Ledger Entry ID",
]);

type PredictionLedgerGlobal = typeof globalThis & {
  __stPredictionLedger?: readonly SealedPredictionEntry[];
};

type SealRequestInput = {
  dealId: string;
  acquirerEnvironmentCode: string;
  targetEnvironmentCode: string;
  primaryActorType: string;
  dominantFunction: string;
  anchors: unknown;
  prediction1: string;
  prediction2: string;
  prediction3: string;
  falsificationCondition: string;
};

export type PredictionSealPayload = {
  acquirerEnvironmentCode: string;
  targetEnvironmentCode: string;
  anchors: readonly string[];
  sealedAt: string;
};

export type SealedPredictionEntry = {
  ledgerEntryId: string;
  sequence: number;
  dealId: string;
  ecsPair: string;
  acquirerEnvironmentCode: string;
  targetEnvironmentCode: string;
  primaryActorType: string;
  dominantFunction: string;
  anchors: readonly string[];
  prediction1: string;
  prediction2: string;
  prediction3: string;
  falsificationCondition: string;
  sealedAt: string;
  status: typeof PREDICTION_LEDGER_STATUS;
  sealHash: string;
  sealVersion: "sha256-v1";
  canonicalHashInput: PredictionSealPayload;
};

function ledger() {
  const root = globalThis as PredictionLedgerGlobal;
  if (!root.__stPredictionLedger) {
    root.__stPredictionLedger = Object.freeze([]);
  }
  return root.__stPredictionLedger;
}

function saveLedger(nextLedger: readonly SealedPredictionEntry[]) {
  const root = globalThis as PredictionLedgerGlobal;
  root.__stPredictionLedger = Object.freeze([...nextLedger]);
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAnchors(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((anchor) => normalizeText(anchor)).filter(Boolean);
}

function requiredMissing(input: SealRequestInput, anchors: readonly string[]) {
  const missing = [];
  for (const key of [
    "dealId",
    "acquirerEnvironmentCode",
    "targetEnvironmentCode",
    "primaryActorType",
    "dominantFunction",
    "prediction1",
    "prediction2",
    "prediction3",
    "falsificationCondition",
  ] as const) {
    if (!normalizeText(input[key])) missing.push(key);
  }
  if (anchors.length !== 3) missing.push("anchors[3]");
  return missing;
}

function freezeEntry(entry: SealedPredictionEntry) {
  return Object.freeze({
    ...entry,
    anchors: Object.freeze([...entry.anchors]),
    canonicalHashInput: Object.freeze({
      ...entry.canonicalHashInput,
      anchors: Object.freeze([...entry.canonicalHashInput.anchors]),
    }),
  });
}

export function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function canonicalSealString(payload: PredictionSealPayload) {
  return JSON.stringify({
    acquirerEnvironmentCode: payload.acquirerEnvironmentCode,
    targetEnvironmentCode: payload.targetEnvironmentCode,
    anchors: payload.anchors,
    sealedAt: payload.sealedAt,
  });
}

export function buildPredictionSealHash(payload: PredictionSealPayload) {
  return sha256Hex(canonicalSealString(payload));
}

export function listSealedPredictionEntries() {
  return ledger().map((entry) => freezeEntry(entry));
}

export function auditRowForEntry(entry: SealedPredictionEntry) {
  return Object.freeze([
    entry.dealId,
    entry.ecsPair,
    entry.primaryActorType,
    entry.dominantFunction,
    entry.prediction1,
    entry.prediction2,
    entry.prediction3,
    entry.falsificationCondition,
    entry.sealedAt,
    entry.status,
    entry.sealHash,
    entry.ledgerEntryId,
  ]);
}

export function exportSealedPredictionAuditRows() {
  return listSealedPredictionEntries().map(auditRowForEntry);
}

export function sealPrediction(input: Partial<SealRequestInput>, sealedAt = new Date().toISOString()) {
  const normalizedInput: SealRequestInput = {
    dealId: normalizeText(input.dealId),
    acquirerEnvironmentCode: normalizeText(input.acquirerEnvironmentCode),
    targetEnvironmentCode: normalizeText(input.targetEnvironmentCode),
    primaryActorType: normalizeText(input.primaryActorType),
    dominantFunction: normalizeText(input.dominantFunction),
    anchors: input.anchors,
    prediction1: normalizeText(input.prediction1),
    prediction2: normalizeText(input.prediction2),
    prediction3: normalizeText(input.prediction3),
    falsificationCondition: normalizeText(input.falsificationCondition),
  };
  const anchors = normalizeAnchors(normalizedInput.anchors);
  const missing = requiredMissing(normalizedInput, anchors);
  if (missing.length > 0) {
    return Object.freeze({
      ok: false,
      status: "prediction-seal-incomplete",
      missing: Object.freeze(missing),
    });
  }

  const canonicalHashInput = Object.freeze({
    acquirerEnvironmentCode: normalizedInput.acquirerEnvironmentCode,
    targetEnvironmentCode: normalizedInput.targetEnvironmentCode,
    anchors: Object.freeze([...anchors]),
    sealedAt,
  });
  const sealHash = buildPredictionSealHash(canonicalHashInput);
  const currentLedger = ledger();
  const entry = freezeEntry({
    ledgerEntryId: `seal-${randomUUID()}`,
    sequence: currentLedger.length + 1,
    dealId: normalizedInput.dealId,
    ecsPair: `${normalizedInput.acquirerEnvironmentCode} x ${normalizedInput.targetEnvironmentCode}`,
    acquirerEnvironmentCode: normalizedInput.acquirerEnvironmentCode,
    targetEnvironmentCode: normalizedInput.targetEnvironmentCode,
    primaryActorType: normalizedInput.primaryActorType,
    dominantFunction: normalizedInput.dominantFunction,
    anchors,
    prediction1: normalizedInput.prediction1,
    prediction2: normalizedInput.prediction2,
    prediction3: normalizedInput.prediction3,
    falsificationCondition: normalizedInput.falsificationCondition,
    sealedAt,
    status: PREDICTION_LEDGER_STATUS,
    sealHash,
    sealVersion: "sha256-v1",
    canonicalHashInput,
  });

  saveLedger([...currentLedger, entry]);

  return Object.freeze({
    ok: true,
    status: "prediction-sealed",
    storage: "backend-append-only-ledger",
    workbookRuntimeWrite: false,
    entry,
  });
}
