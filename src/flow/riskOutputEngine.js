import { buildAnalystWorksheet } from "./analystWorkflow.js";
import { buildEvidenceCoverage, evidenceItemsFromSession } from "./evidenceCapture.js";
import { buildTriageReport } from "./triageEngine.js";

export const RISK_OUTPUT_ENGINE_VERSION = "newlogic-risk-output-v1";

export const CANONICAL_RISK_CATEGORIES = Object.freeze([
  Object.freeze({
    id: "integration_fracture",
    label: "Integration Fracture Risk",
    defaultRecommendation: "Define the integration operating model, decision rights, and protected work boundaries before close.",
  }),
  Object.freeze({
    id: "leadership_accountability",
    label: "Leadership Accountability Risk",
    defaultRecommendation: "Set explicit leadership accountability rules for missed commitments, escalation, and post-close governance.",
  }),
  Object.freeze({
    id: "key_person_retention",
    label: "Key-Person Retention Risk",
    defaultRecommendation: "Identify key people, lock retention economics, and protect the work conditions that keep them productive.",
  }),
  Object.freeze({
    id: "founder_dependency",
    label: "Founder/CEO Dependency Risk",
    aliases: Object.freeze(["Founder / CEO Dependency Risk"]),
    defaultRecommendation: "Map founder-controlled decisions, relationships, and informal authority before integration sequencing.",
  }),
  Object.freeze({
    id: "decision_rights_conflict",
    label: "Decision-Rights Conflict Risk",
    defaultRecommendation: "Resolve decision rights, veto points, and escalation paths before Day 1.",
  }),
  Object.freeze({
    id: "governance_risk",
    label: "Post-Close Governance Risk",
    aliases: Object.freeze(["Governance Risk"]),
    defaultRecommendation: "Install post-close governance with clear authority, evidence standards, and escalation ownership.",
  }),
  Object.freeze({
    id: "political_protection",
    label: "Political Protection / Loyalty-System Risk",
    aliases: Object.freeze(["Political Protection Risk"]),
    defaultRecommendation: "Identify protected actors, loyalty tests, and informal coalitions before they distort integration decisions.",
  }),
  Object.freeze({
    id: "talent_flight",
    label: "Talent Flight Risk",
    defaultRecommendation: "Monitor key-person signals and remove integration conditions likely to trigger departure.",
  }),
  Object.freeze({
    id: "management_performance_drop",
    label: "Management-Team Performance Drop Risk",
    aliases: Object.freeze(["Management Performance Drop Risk"]),
    defaultRecommendation: "Protect management attention, authority, and role clarity during months 6-18.",
  }),
  Object.freeze({
    id: "months_6_18_failure",
    label: "Months 6-18 Failure Risk",
    defaultRecommendation: "Set months 6-18 checkpoints for leadership performance, decision speed, talent movement, and value leakage.",
  }),
]);

const CATEGORY_BY_LABEL = Object.freeze(Object.fromEntries(
  CANONICAL_RISK_CATEGORIES.flatMap((category) => [
    [category.label, category],
    ...(category.aliases ?? []).map((alias) => [alias, category]),
  ]),
));

const STATUS_WEIGHTS = Object.freeze({
  pending_review: 0.5,
  confirmed: 1,
  overridden: 0.75,
  follow_up_required: 0.85,
  not_material: 0,
});

const SEVERITY_SCORES = Object.freeze({
  high: 86,
  medium: 60,
  low: 32,
});

const CONFIDENCE_WEIGHTS = Object.freeze({
  high: 1,
  medium: 0.82,
  low: 0.55,
  cannot_determine: 0.35,
});

const TRIAGE_CONFIDENCE_CAP_RANK = Object.freeze({
  high: 4,
  medium: 3,
  low: 2,
  cannot_determine: 1,
});

function round(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function severityForScore(score) {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function confidenceMin(left, right) {
  if (!left) return right ?? "medium";
  if (!right) return left;
  return TRIAGE_CONFIDENCE_CAP_RANK[left] <= TRIAGE_CONFIDENCE_CAP_RANK[right] ? left : right;
}

function categoryFor(label) {
  return CATEGORY_BY_LABEL[label] ?? null;
}

function normalizedCategoriesForItem(item) {
  return Object.freeze([
    ...new Set((item.riskCategories ?? [])
      .map((label) => categoryFor(label))
      .filter(Boolean)
      .map((category) => category.id)),
  ]);
}

function itemRiskScore(item) {
  const statusWeight = STATUS_WEIGHTS[item.status] ?? STATUS_WEIGHTS.pending_review;
  if (statusWeight <= 0) return 0;
  const severityScore = SEVERITY_SCORES[item.analystSeverity] ?? SEVERITY_SCORES.medium;
  const confidenceWeight = CONFIDENCE_WEIGHTS[item.analystConfidence] ?? CONFIDENCE_WEIGHTS.medium;
  const verifiedEvidenceBonus = Math.min(10, (item.linkedVerifiedEvidenceCount ?? 0) * 5);
  const disputedEvidencePenalty = Math.min(15, (item.linkedDisputedEvidenceCount ?? 0) * 8);
  return clamp(round((severityScore * statusWeight * confidenceWeight) + verifiedEvidenceBonus - disputedEvidencePenalty), 0, 100);
}

function evidenceForCategory(evidenceItems, category) {
  return Object.freeze(evidenceItems.filter((item) => (
    Array.isArray(item.relevantRiskCategories)
      && item.relevantRiskCategories.some((label) => categoryFor(label)?.id === category.id)
  )));
}

function confidenceForItems(items, categoryEvidence, triageCap) {
  let confidence = "high";
  if (items.some((item) => item.analystConfidence === "cannot_determine")) confidence = "cannot_determine";
  else if (items.some((item) => item.analystConfidence === "low")) confidence = "low";
  else if (items.some((item) => item.analystConfidence === "medium")) confidence = "medium";

  const verifiedEvidenceCount = categoryEvidence.filter((item) => item.reviewStatus === "verified").length;
  const disputedEvidenceCount = categoryEvidence.filter((item) => item.reviewStatus === "disputed").length;
  if (disputedEvidenceCount > 0) confidence = confidenceMin(confidence, "low");
  else if (verifiedEvidenceCount === 0 && items.length > 0) confidence = confidenceMin(confidence, "medium");

  return confidenceMin(confidence, triageCap);
}

function leadText(items, fallback) {
  const lead = [...items].sort((left, right) => itemRiskScore(right) - itemRiskScore(left))[0];
  return lead?.title ?? fallback;
}

function evidenceSummaryFor(categoryEvidence) {
  if (categoryEvidence.length === 0) return "No linked Layer 2 evidence item has been captured for this risk category.";
  const verified = categoryEvidence.filter((item) => item.reviewStatus === "verified").length;
  const disputed = categoryEvidence.filter((item) => item.reviewStatus === "disputed").length;
  return `${categoryEvidence.length} linked evidence item(s): ${verified} verified, ${disputed} disputed.`;
}

function recommendationsFor(category, items) {
  const recommendations = [
    ...new Set([
      ...items.map((item) => item.recommendation).filter(Boolean),
      category.defaultRecommendation,
    ]),
  ];
  return Object.freeze(recommendations.slice(0, 3));
}

function categoryOutput(category, items, categoryEvidence, triageReport) {
  const activeItems = items.filter((item) => item.status !== "not_material");
  const itemScores = activeItems.map(itemRiskScore).filter((score) => score > 0);
  const baseScore = itemScores.length ? Math.max(...itemScores) : 18;
  const densityScore = Math.min(12, Math.max(0, activeItems.length - 1) * 4);
  const verifiedEvidenceBonus = Math.min(8, categoryEvidence.filter((item) => item.reviewStatus === "verified").length * 4);
  const disputedEvidencePenalty = Math.min(12, categoryEvidence.filter((item) => item.reviewStatus === "disputed").length * 6);
  const triagePenalty = triageReport.routing?.route === "practitioner_escalation" ? 0 : 0;
  const score = clamp(round(baseScore + densityScore + verifiedEvidenceBonus - disputedEvidencePenalty + triagePenalty), 0, 100);
  const confidence = activeItems.length
    ? confidenceForItems(activeItems, categoryEvidence, triageReport.routing?.confidenceCap ?? "medium")
    : confidenceMin(categoryEvidence.some((item) => item.reviewStatus === "verified") ? "medium" : "low", triageReport.routing?.confidenceCap ?? "medium");

  return Object.freeze({
    id: category.id,
    riskCategory: category.label,
    score,
    severity: severityForScore(score),
    confidence,
    status: activeItems.length > 0 ? "analyst_derived" : "monitor",
    findingCount: activeItems.length,
    evidenceItemCount: categoryEvidence.length,
    verifiedEvidenceItemCount: categoryEvidence.filter((item) => item.reviewStatus === "verified").length,
    disputedEvidenceItemCount: categoryEvidence.filter((item) => item.reviewStatus === "disputed").length,
    evidenceSummary: evidenceSummaryFor(categoryEvidence),
    divergenceSummary: activeItems.length
      ? leadText(activeItems, `${category.label} requires analyst review.`)
      : `${category.label} has no active analyst finding yet; monitor as part of final diligence.`,
    recommendations: recommendationsFor(category, activeItems),
    relatedFindingIds: Object.freeze(activeItems.map((item) => item.findingId)),
    relatedEvidenceItemIds: Object.freeze(categoryEvidence.map((item) => item.id)),
  });
}

export function buildRiskOutputReport(session = {}, options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const analystWorksheet = buildAnalystWorksheet(session, session.analystWorksheet, { generatedAt });
  const evidenceItems = evidenceItemsFromSession(session);
  const evidenceCoverage = buildEvidenceCoverage(session);
  const triageReport = buildTriageReport(session, { generatedAt });
  const itemsByCategory = new Map();

  for (const item of analystWorksheet.items ?? []) {
    for (const categoryId of normalizedCategoriesForItem(item)) {
      if (!itemsByCategory.has(categoryId)) itemsByCategory.set(categoryId, []);
      itemsByCategory.get(categoryId).push(item);
    }
  }

  const outputs = Object.freeze(CANONICAL_RISK_CATEGORIES.map((category) => (
    categoryOutput(category, itemsByCategory.get(category.id) ?? [], evidenceForCategory(evidenceItems, category), triageReport)
  )));
  const rankedOutputs = Object.freeze([...outputs].sort((left, right) => right.score - left.score || left.riskCategory.localeCompare(right.riskCategory)));
  const activeOutputs = rankedOutputs.filter((output) => output.findingCount > 0 || output.evidenceItemCount > 0 || output.severity !== "low");

  return Object.freeze({
    completed: true,
    version: RISK_OUTPUT_ENGINE_VERSION,
    generatedAt,
    triageTier: triageReport.effectiveTier,
    reportGate: triageReport.routing?.gate ?? "analyst_review_required",
    confidenceCap: triageReport.routing?.confidenceCap ?? "medium",
    outputCount: outputs.length,
    activeOutputCount: activeOutputs.length,
    evidenceCoverage,
    outputs,
    rankedOutputs,
    activeOutputs: Object.freeze(activeOutputs),
  });
}
