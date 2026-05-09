import { buildContradictionReport } from "./contradictionEngine.js";

export const ANALYST_WORKFLOW_VERSION = "newlogic-analyst-workflow-v1";

export const ANALYST_REVIEW_STATUSES = Object.freeze([
  "pending_review",
  "confirmed",
  "overridden",
  "follow_up_required",
  "not_material",
]);

export const ANALYST_CONFIDENCE_LEVELS = Object.freeze(["high", "medium", "low", "cannot_determine"]);
export const ANALYST_SEVERITY_LEVELS = Object.freeze(["high", "medium", "low"]);

const STATUS_WEIGHTS = Object.freeze({
  pending_review: 0.6,
  confirmed: 1,
  overridden: 0.75,
  follow_up_required: 0.85,
  not_material: 0,
});

const SEVERITY_SCORES = Object.freeze({
  high: 90,
  medium: 62,
  low: 35,
});

const CONFIDENCE_WEIGHTS = Object.freeze({
  high: 1,
  medium: 0.8,
  low: 0.55,
  cannot_determine: 0.35,
});

const FINDING_RISK_CATEGORIES = Object.freeze({
  acquirer_target_disagreement: Object.freeze([
    "Integration Fracture Risk",
    "Decision-Rights Conflict Risk",
    "Cultural/Operating Environment Misfit",
    "Months 6-18 Failure Risk",
  ]),
  target_observed_self_divergence: Object.freeze([
    "Target Evidence Divergence",
    "Management-Team Performance Drop Risk",
    "Talent Flight Risk",
  ]),
  target_observed_diagnostic_divergence: Object.freeze([
    "Target Evidence Divergence",
    "Post-Close Governance Risk",
  ]),
  target_diagnostic_self_divergence: Object.freeze([
    "Target Evidence Divergence",
    "Leadership Accountability Risk",
  ]),
  low_confidence_primary_signal: Object.freeze([
    "Evidence Reliability",
    "Analyst Follow-Up Required",
  ]),
  indirect_answers_driving_score: Object.freeze([
    "Evidence Reliability",
    "Analyst Follow-Up Required",
  ]),
  reliability_flag_concentration: Object.freeze([
    "Answer Reliability",
    "Political Protection / Loyalty-System Risk",
  ]),
  no_direct_knowledge_concentration: Object.freeze([
    "Evidence Coverage",
    "Analyst Follow-Up Required",
  ]),
  evidence_basis_mismatch: Object.freeze([
    "Evidence Reliability",
    "Analyst Follow-Up Required",
  ]),
});

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStatus(value) {
  return ANALYST_REVIEW_STATUSES.includes(value) ? value : "pending_review";
}

function normalizeSeverity(value, fallback = "medium") {
  return ANALYST_SEVERITY_LEVELS.includes(value) ? value : fallback;
}

function normalizeConfidence(value, fallback = "medium") {
  return ANALYST_CONFIDENCE_LEVELS.includes(value) ? value : fallback;
}

function round(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function categoryListForFinding(finding) {
  return Object.freeze([
    ...new Set([
      ...(FINDING_RISK_CATEGORIES[finding.type] ?? []),
      finding.riskCategory,
    ].filter(Boolean)),
  ]);
}

function defaultRecommendation(finding) {
  if (finding.type === "acquirer_target_disagreement") {
    return "Run a decision-rights and integration-governance review before treating the operating model as executable.";
  }
  if (finding.type?.includes("divergence")) {
    return "Collect role-specific follow-up evidence and document which respondent perspective is observable, inferred, or contradicted.";
  }
  if (finding.type === "reliability_flag_concentration") {
    return "Review flagged answers with supporting documents or additional respondents before using this signal as a deal fact.";
  }
  if (finding.type === "no_direct_knowledge_concentration") {
    return "Do not rely on this module as factual evidence until direct or document-supported evidence is added.";
  }
  return "Escalate to analyst review before final risk interpretation.";
}

function existingReviewByFindingId(existingWorksheet) {
  return Object.freeze(Object.fromEntries(
    (existingWorksheet?.items ?? []).map((item) => [item.findingId, item]),
  ));
}

function evidenceItemsForFinding(evidenceItems = [], findingId) {
  return Object.freeze(evidenceItems.filter((item) => Array.isArray(item.relatedFindingIds) && item.relatedFindingIds.includes(findingId)));
}

function reviewItemFromFinding(finding, existingItem, reviewedAt, evidenceItems = []) {
  const status = normalizeStatus(existingItem?.status);
  const analystSeverity = normalizeSeverity(existingItem?.analystSeverity, finding.severity);
  const analystConfidence = normalizeConfidence(existingItem?.analystConfidence, "medium");
  const linkedEvidence = evidenceItemsForFinding(evidenceItems, finding.id);
  return Object.freeze({
    findingId: finding.id,
    type: finding.type,
    status,
    title: finding.title,
    findingSeverity: finding.severity,
    analystSeverity,
    analystConfidence,
    riskCategories: categoryListForFinding(finding),
    evidenceBasis: finding.evidenceBasis,
    linkedEvidenceItemIds: Object.freeze(linkedEvidence.map((item) => item.id)),
    linkedEvidenceCount: linkedEvidence.length,
    linkedVerifiedEvidenceCount: linkedEvidence.filter((item) => item.reviewStatus === "verified").length,
    linkedDisputedEvidenceCount: linkedEvidence.filter((item) => item.reviewStatus === "disputed").length,
    analystRationale: normalizeString(existingItem?.analystRationale),
    recommendation: normalizeString(existingItem?.recommendation) || defaultRecommendation(finding),
    reviewedAt: existingItem?.reviewedAt ?? null,
    createdAt: existingItem?.createdAt ?? reviewedAt,
    sourceFinding: finding,
  });
}

function activeItemScore(item) {
  const statusWeight = STATUS_WEIGHTS[item.status] ?? STATUS_WEIGHTS.pending_review;
  if (statusWeight <= 0) return 0;
  const severityScore = SEVERITY_SCORES[item.analystSeverity] ?? SEVERITY_SCORES.medium;
  const confidenceWeight = CONFIDENCE_WEIGHTS[item.analystConfidence] ?? CONFIDENCE_WEIGHTS.medium;
  return round(severityScore * statusWeight * confidenceWeight);
}

function severityForScore(score) {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function confidenceForItems(items) {
  if (items.some((item) => item.analystConfidence === "cannot_determine")) return "cannot_determine";
  if (items.some((item) => item.analystConfidence === "low")) return "low";
  if (items.some((item) => item.analystConfidence === "medium")) return "medium";
  return "high";
}

export function buildAnalystRiskOutputs(items = []) {
  const categoryMap = new Map();
  for (const item of items) {
    if (item.status === "not_material") continue;
    const itemScore = activeItemScore(item);
    if (itemScore <= 0) continue;

    for (const riskCategory of item.riskCategories ?? []) {
      if (!categoryMap.has(riskCategory)) categoryMap.set(riskCategory, []);
      categoryMap.get(riskCategory).push(Object.freeze({ ...item, itemScore }));
    }
  }

  return Object.freeze([...categoryMap.entries()].map(([riskCategory, categoryItems]) => {
    const maxScore = Math.max(...categoryItems.map((item) => item.itemScore));
    const densityScore = Math.min(12, (categoryItems.length - 1) * 4);
    const confirmedBonus = Math.min(8, categoryItems.filter((item) => item.status === "confirmed").length * 4);
    const score = Math.min(100, round(maxScore + densityScore + confirmedBonus));
    const severeItems = [...categoryItems].sort((left, right) => (
      right.itemScore - left.itemScore
      || left.title.localeCompare(right.title)
    ));
    const leadItem = severeItems[0];

    return Object.freeze({
      riskCategory,
      score,
      severity: severityForScore(score),
      confidence: confidenceForItems(categoryItems),
      findingCount: categoryItems.length,
      evidenceSummary: leadItem?.evidenceBasis ?? "Analyst worksheet finding.",
      divergenceSummary: leadItem?.title ?? "Analyst-reviewed risk output.",
      recommendations: Object.freeze([...new Set(categoryItems.map((item) => item.recommendation).filter(Boolean))].slice(0, 3)),
      relatedFindingIds: Object.freeze(categoryItems.map((item) => item.findingId)),
    });
  }).sort((left, right) => right.score - left.score || left.riskCategory.localeCompare(right.riskCategory)));
}

export function buildAnalystWorksheet(session = {}, existingWorksheet = null, options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const contradictionReport = buildContradictionReport(session, { generatedAt });
  const existingById = existingReviewByFindingId(existingWorksheet);
  const evidenceItems = Array.isArray(session?.evidenceItems) ? session.evidenceItems : [];
  const items = Object.freeze(
    contradictionReport.findings.map((finding) => reviewItemFromFinding(finding, existingById[finding.id], generatedAt, evidenceItems)),
  );
  const reviewedCount = items.filter((item) => item.status !== "pending_review").length;
  const riskOutputs = buildAnalystRiskOutputs(items);

  return Object.freeze({
    completed: items.length > 0 && reviewedCount === items.length,
    version: ANALYST_WORKFLOW_VERSION,
    generatedAt,
    contradictionReportVersion: contradictionReport.version,
    findingCount: items.length,
    reviewedCount,
    pendingCount: items.length - reviewedCount,
    items,
    riskOutputs,
  });
}

export function applyAnalystReview(worksheet, findingId, input = {}, reviewedAt = new Date().toISOString()) {
  const normalizedFindingId = normalizeString(findingId);
  if (!worksheet || !normalizedFindingId) return worksheet;

  const items = Object.freeze((worksheet.items ?? []).map((item) => {
    if (item.findingId !== normalizedFindingId) return item;
    return Object.freeze({
      ...item,
      status: normalizeStatus(input.status ?? item.status),
      analystSeverity: normalizeSeverity(input.analystSeverity ?? item.analystSeverity, item.analystSeverity),
      analystConfidence: normalizeConfidence(input.analystConfidence ?? item.analystConfidence, item.analystConfidence),
      analystRationale: input.analystRationale === undefined ? item.analystRationale : normalizeString(input.analystRationale),
      recommendation: input.recommendation === undefined ? item.recommendation : normalizeString(input.recommendation),
      reviewedAt,
    });
  }));
  const reviewedCount = items.filter((item) => item.status !== "pending_review").length;

  return Object.freeze({
    ...worksheet,
    completed: items.length > 0 && reviewedCount === items.length,
    reviewedCount,
    pendingCount: items.length - reviewedCount,
    updatedAt: reviewedAt,
    items,
    riskOutputs: buildAnalystRiskOutputs(items),
  });
}

export function attachAnalystWorksheetReview(session = {}, findingId, input = {}, reviewedAt = new Date().toISOString()) {
  const worksheet = buildAnalystWorksheet(session, session.analystWorksheet, { generatedAt: reviewedAt });
  const analystWorksheet = applyAnalystReview(worksheet, findingId, input, reviewedAt);
  return Object.freeze({
    session: Object.freeze({
      ...session,
      analystWorksheet,
    }),
    analystWorksheet,
  });
}
