import { buildAnalystWorksheet } from "./analystWorkflow.js";
import { buildContradictionReport } from "./contradictionEngine.js";
import { buildEvidenceCoverage, evidenceItemsFromSession } from "./evidenceCapture.js";
import { buildRiskOutputReport } from "./riskOutputEngine.js";
import { buildTriageReport } from "./triageEngine.js";

export const FINAL_REPORT_ENGINE_VERSION = "newlogic-final-report-v1";

export const DEAL_ECONOMICS_UNAVAILABLE_TEXT = "Financial exposure is not calculated in this preliminary sample because deal value and compensation inputs are not confirmed.";
export const DEAL_ECONOMICS_INPUT_PROMPT_TEXT = "Provide EV and confirmed compensation inputs to calculate a structure-based risk envelope.";
export const DEAL_ECONOMICS_MISSING_INPUT_TEXT = "Missing input: EV / deal value and confirmed compensation assumptions.";

export const FINAL_REPORT_SECTION_ORDER = Object.freeze([
  "executive_summary",
  "deal_context",
  "respondent_coverage",
  "evidence_coverage",
  "contradiction_review",
  "triage_route",
  "analyst_findings",
  "formal_risk_outputs",
  "actions_roadmap",
  "limitations",
  "audit_record",
]);

function labelize(value, fallback = "Pending") {
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  return text
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sentence(value) {
  return String(value ?? "").trim();
}

function firstPresentValue(candidates) {
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && candidate !== "") return candidate;
  }
  return null;
}

function dealEconomicsValue(session, key) {
  return firstPresentValue([
    session?.dealContext?.data?.[key],
    session?.preliminaryAssessment?.dealContext?.[key],
  ]);
}

function parseDealEconomicsNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function dealEconomicsStatusLabel(status) {
  return String(status ?? "not_available").replace(/_/g, " ");
}

function formatDealEconomicsAmount(currency, amount) {
  const formatted = Number(amount).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
}

function dealEconomicsInput(session, config) {
  const status = String(dealEconomicsValue(session, config.statusKey) ?? "not_available");
  const amount = parseDealEconomicsNumber(dealEconomicsValue(session, config.valueKey));
  const currency = String(dealEconomicsValue(session, config.currencyKey) ?? "").trim();
  const provided = (status === "confirmed" || status === "estimated") && amount !== null && Boolean(currency);

  return Object.freeze({
    provided,
    status,
    statusLabel: dealEconomicsStatusLabel(status),
    amount,
    currency,
    line: provided ? `${config.label}: ${formatDealEconomicsAmount(currency, amount)} (${dealEconomicsStatusLabel(status)}).` : "",
  });
}

export function buildDealEconomicsReport(session = {}) {
  const enterpriseValue = dealEconomicsInput(session, {
    valueKey: "enterpriseValue",
    currencyKey: "enterpriseValueCurrency",
    statusKey: "enterpriseValueStatus",
    label: "Enterprise value / deal value provided",
  });
  const compensation = dealEconomicsInput(session, {
    valueKey: "compensationAssumptions",
    currencyKey: "compensationCurrency",
    statusKey: "compensationStatus",
    label: "Compensation assumptions provided",
  });

  const lines = (() => {
    if (!enterpriseValue.provided && !compensation.provided) {
      return [
        DEAL_ECONOMICS_UNAVAILABLE_TEXT,
        DEAL_ECONOMICS_MISSING_INPUT_TEXT,
        DEAL_ECONOMICS_INPUT_PROMPT_TEXT,
      ];
    }
    if (enterpriseValue.provided && !compensation.provided) {
      return [
        enterpriseValue.line,
        "Compensation assumptions are not confirmed, so the structure-based risk envelope is not calculated.",
      ];
    }
    if (!enterpriseValue.provided && compensation.provided) {
      return [
        compensation.line,
        "EV / deal value is not confirmed, so the structure-based risk envelope is not calculated.",
      ];
    }
    return [
      enterpriseValue.line,
      compensation.line,
      "Both EV and compensation assumptions are available. Risk-envelope calculation requires a defined formula.",
    ];
  })();

  return Object.freeze({
    available: enterpriseValue.provided || compensation.provided,
    inputsAvailable: enterpriseValue.provided && compensation.provided,
    calculated: false,
    enterpriseValue,
    compensation,
    lines: Object.freeze(lines),
    text: lines[0] ?? "",
    missingInput: lines[1] ?? "",
    prompt: lines[2] ?? "",
  });
}

function compactList(items, limit = 5) {
  return Object.freeze(items.filter(Boolean).slice(0, limit));
}

function section(id, title, summary, items = [], records = []) {
  return Object.freeze({
    id,
    title,
    summary: sentence(summary),
    items: compactList(items, 8),
    records: Object.freeze(records.filter(Boolean)),
  });
}

function topRiskOutputs(riskOutputReport, limit = 5) {
  return riskOutputReport.rankedOutputs.slice(0, limit);
}

function respondentCoverage(session) {
  return Object.freeze([
    session?.acquirer2A?.completed ? "Acquirer self-observation completed." : "Acquirer self-observation pending.",
    session?.acquirer2A?.score?.verificationIncluded ? "Second acquirer verification merged." : "Second acquirer verification not merged.",
    session?.targetObservation?.completed ? "Target observation completed." : "Target observation pending.",
    session?.target2B?.completed ? "Target diagnostic completed." : "Target diagnostic pending.",
    session?.targetSelfAssessment?.completed ? "Target self-assessment completed." : "Target self-assessment pending.",
  ]);
}

function analystFindingLines(worksheet) {
  return compactList((worksheet.items ?? []).map((item) => (
    `${item.title}: ${labelize(item.status)}; severity ${item.analystSeverity}; confidence ${item.analystConfidence}; ${item.linkedEvidenceCount ?? 0} linked evidence item(s).`
  )), 8);
}

function riskOutputLines(riskOutputReport) {
  return compactList(riskOutputReport.rankedOutputs.map((risk) => (
    `${risk.riskCategory}: ${risk.severity} severity, confidence ${risk.confidence}, score ${risk.score}/100. ${risk.divergenceSummary}`
  )), 10);
}

function actionRoadmap(riskOutputReport, deliverable) {
  return compactList([...new Set([
    ...riskOutputReport.rankedOutputs.flatMap((risk) => risk.recommendations ?? []),
    ...(deliverable?.protocol?.dealInsights ?? []).map((insight) => insight.text),
  ])], 8);
}

function limitationLines({ riskOutputReport, triageReport, evidenceCoverage, worksheet }) {
  return Object.freeze([
    `Confidence cap: ${labelize(riskOutputReport.confidenceCap)}.`,
    `Report gate: ${labelize(riskOutputReport.reportGate)}.`,
    worksheet.pendingCount > 0
      ? `${worksheet.pendingCount} analyst finding(s) remain pending review.`
      : "All current analyst worksheet findings have a review status.",
    evidenceCoverage.verifiedCount === 0
      ? "No verified Layer 2 evidence item has been captured yet."
      : `${evidenceCoverage.verifiedCount} verified Layer 2 evidence item(s) captured.`,
    triageReport.routing?.route === "practitioner_escalation"
      ? "Practitioner escalation is required before paid output should be treated as final."
      : "No practitioner escalation gate is currently active.",
    "This report does not treat respondent answers as factual truth; answers are interpreted as structured evidence.",
  ]);
}

export function buildFinalReportStructure(session = {}, deliverable = {}, options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const contradictionReport = buildContradictionReport(session, { generatedAt });
  const triageReport = buildTriageReport(session, { generatedAt, contradictionReport });
  const worksheet = buildAnalystWorksheet(session, session.analystWorksheet, { generatedAt });
  const evidenceCoverage = buildEvidenceCoverage(session);
  const riskOutputReport = buildRiskOutputReport(session, { generatedAt });
  const evidenceItems = evidenceItemsFromSession(session);
  const dealContext = session?.dealContext?.data ?? {};
  const topRisks = topRiskOutputs(riskOutputReport, 3);

  const sections = Object.freeze([
    section(
      "executive_summary",
      "Executive Summary",
      deliverable?.ready
        ? `${deliverable.acquirerAlias} acquiring ${deliverable.targetAlias}: ${deliverable.riskBand}, compatibility ${deliverable.compatibilityRange}.`
        : "Final report is not ready because the deal pair is incomplete.",
      [
        deliverable?.narrative?.headline ?? deliverable?.headline,
        `Top risk categories: ${topRisks.map((risk) => risk.riskCategory).join(", ") || "none active"}.`,
        `Report gate: ${labelize(riskOutputReport.reportGate)}.`,
      ],
    ),
    section(
      "deal_context",
      "Deal Context",
      `${dealContext.acquirerName ?? "Acquirer pending"} acquiring ${dealContext.targetName ?? "target pending"}.`,
      [
        `Deal type: ${labelize(dealContext.dealType)}.`,
        `Respondent side: ${labelize(dealContext.respondentSide)}.`,
        `Respondent role: ${labelize(dealContext.respondentRole)}.`,
        `Seniority: ${labelize(dealContext.respondentSeniority)}.`,
        `Function: ${labelize(dealContext.respondentFunction)}.`,
        `Access level: ${labelize(dealContext.respondentAccessLevel)}.`,
      ],
    ),
    section(
      "respondent_coverage",
      "Respondent Coverage",
      "Respondent evidence is preserved by role and workflow position.",
      respondentCoverage(session),
    ),
    section(
      "evidence_coverage",
      "Evidence Coverage",
      evidenceCoverage.coverageNote,
      [
        `${evidenceCoverage.totalCount} evidence item(s).`,
        `${evidenceCoverage.verifiedCount} verified; ${evidenceCoverage.disputedCount} disputed; ${evidenceCoverage.unreviewedCount} unreviewed.`,
        evidenceCoverage.verifiedRiskCategories.length
          ? `Verified risk coverage: ${evidenceCoverage.verifiedRiskCategories.join(", ")}.`
          : "No verified risk-category evidence coverage yet.",
      ],
      evidenceItems.slice(0, 8),
    ),
    section(
      "contradiction_review",
      "Contradiction Review",
      `${contradictionReport.summary.contradictionCount} contradiction or divergence finding(s); ${contradictionReport.summary.highSeverityCount} high severity.`,
      compactList(contradictionReport.findings.map((finding) => (
        `${finding.title}: ${finding.severity} severity. ${finding.explanation}`
      )), 8),
    ),
    section(
      "triage_route",
      "Triage Route",
      triageReport.routing.label,
      [
        `Effective tier: ${labelize(triageReport.effectiveTier)}.`,
        `Reliability tier: ${labelize(triageReport.reliabilityTier)}.`,
        `Contradiction tier: ${labelize(triageReport.contradictionTier)}.`,
        `Instrument action: ${triageReport.instrumentAction}`,
        ...triageReport.triggers.slice(0, 4).map((trigger) => `${trigger.label}: ${trigger.meaning}`),
      ],
    ),
    section(
      "analyst_findings",
      "Analyst Findings",
      `${worksheet.reviewedCount}/${worksheet.findingCount} analyst finding(s) reviewed.`,
      analystFindingLines(worksheet),
    ),
    section(
      "formal_risk_outputs",
      "Formal Risk Outputs",
      `${riskOutputReport.outputCount} canonical risk output record(s) composed.`,
      riskOutputLines(riskOutputReport),
      riskOutputReport.outputs,
    ),
    section(
      "actions_roadmap",
      "Actions Roadmap",
      "Priority actions are derived from analyst-reviewed risk outputs and deal-specific integration controls.",
      actionRoadmap(riskOutputReport, deliverable),
    ),
    section(
      "limitations",
      "Limitations",
      "Limits are explicit because respondent answers are treated as evidence, not truth.",
      limitationLines({ riskOutputReport, triageReport, evidenceCoverage, worksheet }),
    ),
    section(
      "audit_record",
      "Audit Record",
      "Report composition records the active methodological chain and generated record counts.",
      [
        `Report version: ${FINAL_REPORT_ENGINE_VERSION}.`,
        `Generated at: ${generatedAt}.`,
        `Contradiction findings: ${contradictionReport.findings.length}.`,
        `Analyst findings: ${worksheet.items.length}.`,
        `Risk outputs: ${riskOutputReport.outputs.length}.`,
        `Evidence items: ${evidenceCoverage.totalCount}.`,
      ],
    ),
  ]);

  return Object.freeze({
    completed: true,
    version: FINAL_REPORT_ENGINE_VERSION,
    generatedAt,
    sections,
    sectionCount: sections.length,
    sectionOrder: FINAL_REPORT_SECTION_ORDER,
    contradictionReport,
    evidenceCoverage,
    triageReport,
    analystWorksheet: worksheet,
    riskOutputReport,
  });
}
