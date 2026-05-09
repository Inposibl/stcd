const { createHash, randomUUID } = require("node:crypto");

const PREDICTION_LEDGER_WORKBOOK = "ST_Prediction_Ledger_v1.xlsx";
const PREDICTION_LEDGER_SHEET = "SEALED_PREDICTIONS";
const PREDICTION_LEDGER_STATUS = "SEALED";

const PREDICTION_LEDGER_HEADERS = Object.freeze([
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

function ledger() {
  if (!globalThis.__stPredictionLedger) {
    globalThis.__stPredictionLedger = Object.freeze([]);
  }
  return globalThis.__stPredictionLedger;
}

function saveLedger(nextLedger) {
  globalThis.__stPredictionLedger = Object.freeze([...nextLedger]);
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAnchors(value) {
  if (!Array.isArray(value)) return [];
  return value.map((anchor) => normalizeText(anchor)).filter(Boolean);
}

function requiredMissing(input, anchors) {
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
  ]) {
    if (!normalizeText(input[key])) missing.push(key);
  }
  if (anchors.length !== 3) missing.push("anchors[3]");
  return missing;
}

function freezeEntry(entry) {
  return Object.freeze({
    ...entry,
    anchors: Object.freeze([...entry.anchors]),
    canonicalHashInput: Object.freeze({
      ...entry.canonicalHashInput,
      anchors: Object.freeze([...entry.canonicalHashInput.anchors]),
    }),
  });
}

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalSealString(payload) {
  return JSON.stringify({
    acquirerEnvironmentCode: payload.acquirerEnvironmentCode,
    targetEnvironmentCode: payload.targetEnvironmentCode,
    anchors: payload.anchors,
    sealedAt: payload.sealedAt,
  });
}

function buildPredictionSealHash(payload) {
  return sha256Hex(canonicalSealString(payload));
}

function listSealedPredictionEntries() {
  return ledger().map((entry) => freezeEntry(entry));
}

function auditRowForEntry(entry) {
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

function exportSealedPredictionAuditRows() {
  return listSealedPredictionEntries().map(auditRowForEntry);
}

function sealPrediction(input, sealedAt = new Date().toISOString()) {
  const normalizedInput = {
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
    storage: "netlify-function-memory-ledger",
    workbookRuntimeWrite: false,
    entry,
  });
}

module.exports = {
  PREDICTION_LEDGER_HEADERS,
  PREDICTION_LEDGER_SHEET,
  PREDICTION_LEDGER_WORKBOOK,
  exportSealedPredictionAuditRows,
  sealPrediction,
};
