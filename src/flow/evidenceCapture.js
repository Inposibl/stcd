export const EVIDENCE_CAPTURE_VERSION = "newlogic-evidence-capture-v1";

export const EVIDENCE_ITEM_TYPE_OPTIONS = Object.freeze([
  Object.freeze({ value: "document", label: "Document" }),
  Object.freeze({ value: "interview", label: "Interview note" }),
  Object.freeze({ value: "dataroom_extract", label: "Dataroom extract" }),
  Object.freeze({ value: "public_record", label: "Public record" }),
  Object.freeze({ value: "other", label: "Other evidence" }),
]);

export const EVIDENCE_DOCUMENT_TYPE_OPTIONS = Object.freeze([
  Object.freeze({ value: "org_chart", label: "Org chart" }),
  Object.freeze({ value: "reporting_lines", label: "Reporting lines" }),
  Object.freeze({ value: "management_presentation", label: "Management presentation" }),
  Object.freeze({ value: "integration_plan", label: "Integration plan" }),
  Object.freeze({ value: "governance_model", label: "Governance model" }),
  Object.freeze({ value: "decision_rights", label: "Decision-rights document" }),
  Object.freeze({ value: "retention_compensation", label: "Retention or compensation data" }),
  Object.freeze({ value: "promotion_attrition", label: "Promotion or attrition history" }),
  Object.freeze({ value: "leadership_change", label: "Leadership-change record" }),
  Object.freeze({ value: "interview_note", label: "Interview note" }),
  Object.freeze({ value: "board_material", label: "Board material" }),
  Object.freeze({ value: "other", label: "Other" }),
]);

export const EVIDENCE_SOURCE_PARTY_OPTIONS = Object.freeze([
  Object.freeze({ value: "acquirer", label: "Acquirer" }),
  Object.freeze({ value: "target", label: "Target" }),
  Object.freeze({ value: "advisor", label: "Advisor" }),
  Object.freeze({ value: "board", label: "Board / investment committee" }),
  Object.freeze({ value: "external", label: "External" }),
  Object.freeze({ value: "other", label: "Other" }),
]);

export const EVIDENCE_REVIEW_STATUS_OPTIONS = Object.freeze([
  Object.freeze({ value: "unreviewed", label: "Unreviewed" }),
  Object.freeze({ value: "under_review", label: "Under review" }),
  Object.freeze({ value: "verified", label: "Verified" }),
  Object.freeze({ value: "disputed", label: "Disputed" }),
]);

export const EVIDENCE_CONFIDENCE_OPTIONS = Object.freeze([
  Object.freeze({ value: "high", label: "High" }),
  Object.freeze({ value: "medium", label: "Medium" }),
  Object.freeze({ value: "low", label: "Low" }),
  Object.freeze({ value: "cannot_determine", label: "Cannot determine" }),
]);

export const EVIDENCE_RELATIONSHIP_OPTIONS = Object.freeze([
  Object.freeze({ value: "supports", label: "Supports respondent evidence" }),
  Object.freeze({ value: "contradicts", label: "Contradicts respondent evidence" }),
  Object.freeze({ value: "context", label: "Context only" }),
  Object.freeze({ value: "follow_up", label: "Requires follow-up" }),
]);

export const EVIDENCE_RISK_CATEGORY_OPTIONS = Object.freeze([
  Object.freeze({ value: "Integration Fracture Risk", label: "Integration Fracture Risk" }),
  Object.freeze({ value: "Leadership Accountability Risk", label: "Leadership Accountability Risk" }),
  Object.freeze({ value: "Key-Person Retention Risk", label: "Key-Person Retention Risk" }),
  Object.freeze({ value: "Founder/CEO Dependency Risk", label: "Founder/CEO Dependency Risk" }),
  Object.freeze({ value: "Decision-Rights Conflict Risk", label: "Decision-Rights Conflict Risk" }),
  Object.freeze({ value: "Post-Close Governance Risk", label: "Post-Close Governance Risk" }),
  Object.freeze({ value: "Political Protection / Loyalty-System Risk", label: "Political Protection / Loyalty-System Risk" }),
  Object.freeze({ value: "Talent Flight Risk", label: "Talent Flight Risk" }),
  Object.freeze({ value: "Management-Team Performance Drop Risk", label: "Management-Team Performance Drop Risk" }),
  Object.freeze({ value: "Months 6-18 Failure Risk", label: "Months 6-18 Failure Risk" }),
]);

const ITEM_TYPE_VALUES = new Set(EVIDENCE_ITEM_TYPE_OPTIONS.map((option) => option.value));
const DOCUMENT_TYPE_VALUES = new Set(EVIDENCE_DOCUMENT_TYPE_OPTIONS.map((option) => option.value));
const SOURCE_PARTY_VALUES = new Set(EVIDENCE_SOURCE_PARTY_OPTIONS.map((option) => option.value));
const REVIEW_STATUS_VALUES = new Set(EVIDENCE_REVIEW_STATUS_OPTIONS.map((option) => option.value));
const CONFIDENCE_VALUES = new Set(EVIDENCE_CONFIDENCE_OPTIONS.map((option) => option.value));
const RELATIONSHIP_VALUES = new Set(EVIDENCE_RELATIONSHIP_OPTIONS.map((option) => option.value));
const RISK_CATEGORY_VALUES = new Set(EVIDENCE_RISK_CATEGORY_OPTIONS.map((option) => option.value));

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeArray(value, allowed = null) {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const normalized = raw.map(normalizeString).filter(Boolean);
  const filtered = allowed ? normalized.filter((item) => allowed.has(item)) : normalized;
  return Object.freeze([...new Set(filtered)]);
}

function stableSuffix(value) {
  let hash = 2166136261;
  const input = normalizeString(value) || "evidence";
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function evidenceItemId(input, createdAt) {
  if (normalizeString(input.id)) return normalizeString(input.id);
  return `ev-${Date.parse(createdAt) || Date.now()}-${stableSuffix(`${input.title}:${input.storageReference}`)}`;
}

function dealIdForSession(session) {
  return session?.preliminaryAssessment?.assessmentId ?? session?.sessionId ?? "public-session";
}

export function validateEvidenceItem(input = {}) {
  const normalized = {};
  const missing = [];

  const title = normalizeString(input.title);
  if (!title) missing.push("title");
  normalized.title = title;

  const itemType = normalizeString(input.itemType);
  if (!ITEM_TYPE_VALUES.has(itemType)) missing.push("itemType");
  normalized.itemType = itemType;

  const documentType = normalizeString(input.documentType);
  if (!DOCUMENT_TYPE_VALUES.has(documentType)) missing.push("documentType");
  normalized.documentType = documentType;

  const sourceParty = normalizeString(input.sourceParty);
  if (!SOURCE_PARTY_VALUES.has(sourceParty)) missing.push("sourceParty");
  normalized.sourceParty = sourceParty;

  const storageReference = normalizeString(input.storageReference);
  if (!storageReference) missing.push("storageReference");
  normalized.storageReference = storageReference;

  const reviewStatus = normalizeString(input.reviewStatus) || "unreviewed";
  if (!REVIEW_STATUS_VALUES.has(reviewStatus)) missing.push("reviewStatus");
  normalized.reviewStatus = reviewStatus;

  const confidence = normalizeString(input.confidence) || "medium";
  if (!CONFIDENCE_VALUES.has(confidence)) missing.push("confidence");
  normalized.confidence = confidence;

  const relationship = normalizeString(input.relationship) || "context";
  if (!RELATIONSHIP_VALUES.has(relationship)) missing.push("relationship");
  normalized.relationship = relationship;

  normalized.producedDate = normalizeString(input.producedDate) || null;
  normalized.analystExtract = normalizeString(input.analystExtract);
  normalized.documentName = normalizeString(input.documentName);
  normalized.documentSize = Number.isFinite(Number(input.documentSize)) ? Number(input.documentSize) : null;
  normalized.relevantQuestionIds = normalizeArray(input.relevantQuestionIds);
  normalized.relevantRiskCategories = normalizeArray(input.relevantRiskCategories, RISK_CATEGORY_VALUES);
  normalized.relatedFindingIds = normalizeArray(input.relatedFindingIds);
  normalized.contradictsAnswerIds = normalizeArray(input.contradictsAnswerIds);
  normalized.corroboratesAnswerIds = normalizeArray(input.corroboratesAnswerIds);

  return Object.freeze({
    valid: missing.length === 0,
    missing: Object.freeze(missing),
    normalized: Object.freeze(normalized),
  });
}

export function buildEvidenceItem(input = {}, session = {}, createdAt = new Date().toISOString()) {
  const validation = validateEvidenceItem(input);
  if (!validation.valid) {
    return Object.freeze({
      completed: false,
      missing: validation.missing,
      item: null,
      validation,
    });
  }

  const item = Object.freeze({
    id: evidenceItemId(input, createdAt),
    dealId: normalizeString(input.dealId) || dealIdForSession(session),
    createdAt: input.createdAt ?? createdAt,
    updatedAt: input.id ? createdAt : null,
    ...validation.normalized,
  });

  return Object.freeze({
    completed: true,
    item,
    validation,
  });
}

export function evidenceItemsFromSession(session = {}) {
  return Object.freeze(Array.isArray(session?.evidenceItems) ? session.evidenceItems : []);
}

export function attachEvidenceItem(session = {}, input = {}, createdAt = new Date().toISOString()) {
  const result = buildEvidenceItem(input, session, createdAt);
  if (!result.completed) {
    return Object.freeze({
      ok: false,
      session,
      evidenceItem: null,
      validation: result.validation,
    });
  }

  const currentItems = evidenceItemsFromSession(session);
  const nextItems = Object.freeze([
    ...currentItems.filter((item) => item.id !== result.item.id),
    result.item,
  ]);

  return Object.freeze({
    ok: true,
    evidenceItem: result.item,
    validation: result.validation,
    session: Object.freeze({
      ...session,
      evidenceItems: nextItems,
    }),
  });
}

export function removeEvidenceItem(session = {}, itemId) {
  const normalizedId = normalizeString(itemId);
  return Object.freeze({
    session: Object.freeze({
      ...session,
      evidenceItems: Object.freeze(evidenceItemsFromSession(session).filter((item) => item.id !== normalizedId)),
    }),
  });
}

function countBy(items, key) {
  const counts = {};
  for (const item of items) {
    const value = item?.[key] ?? "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return Object.freeze(counts);
}

export function buildEvidenceCoverage(session = {}) {
  const items = evidenceItemsFromSession(session);
  const verifiedItems = items.filter((item) => item.reviewStatus === "verified");
  const disputedItems = items.filter((item) => item.reviewStatus === "disputed");
  const underReviewItems = items.filter((item) => item.reviewStatus === "under_review");
  const unreviewedItems = items.filter((item) => item.reviewStatus === "unreviewed");
  const riskCategoriesCovered = Object.freeze([...new Set(items.flatMap((item) => item.relevantRiskCategories ?? []))]);
  const verifiedRiskCategories = Object.freeze([...new Set(verifiedItems.flatMap((item) => item.relevantRiskCategories ?? []))]);
  const missingCriticalRiskCategories = Object.freeze(
    EVIDENCE_RISK_CATEGORY_OPTIONS
      .map((option) => option.value)
      .filter((category) => !verifiedRiskCategories.includes(category)),
  );
  const linkedFindingIds = Object.freeze([...new Set(items.flatMap((item) => item.relatedFindingIds ?? []))]);

  return Object.freeze({
    completed: true,
    version: EVIDENCE_CAPTURE_VERSION,
    totalCount: items.length,
    verifiedCount: verifiedItems.length,
    disputedCount: disputedItems.length,
    underReviewCount: underReviewItems.length,
    unreviewedCount: unreviewedItems.length,
    documentSupportedCount: items.filter((item) => item.itemType === "document" || item.itemType === "dataroom_extract" || item.itemType === "public_record").length,
    linkedFindingCount: linkedFindingIds.length,
    riskCategoriesCovered,
    verifiedRiskCategories,
    missingCriticalRiskCategories,
    statusCounts: countBy(items, "reviewStatus"),
    documentTypeCounts: countBy(items, "documentType"),
    sourcePartyCounts: countBy(items, "sourceParty"),
    coverageNote: items.length === 0
      ? "No Layer 2 evidence items have been captured yet."
      : `${items.length} evidence item(s), ${verifiedItems.length} verified, ${disputedItems.length} disputed, ${linkedFindingIds.length} linked to contradiction or analyst findings.`,
  });
}
