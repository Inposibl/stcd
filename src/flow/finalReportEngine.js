import { buildAnalystWorksheet } from "./analystWorkflow.js";
import { buildContradictionReport } from "./contradictionEngine.js";
import { buildEvidenceCoverage, evidenceItemsFromSession } from "./evidenceCapture.js";
import { buildRiskOutputReport } from "./riskOutputEngine.js";
import { buildTriageReport } from "./triageEngine.js";
import { DEAL_ECONOMICS_DISCLAIMER } from "../data/dealEconomicsFormulaSpec.js";
import {
  calculateDealEconomicsRiskEnvelope,
  describeOpenEndedHigh,
  formatMillions,
  getEcsValuationBand,
  normalizeMoneyToMillions,
} from "./dealEconomicsRiskEnvelope.js";

export const FINAL_REPORT_ENGINE_VERSION = "newlogic-final-report-v1";

export const DEAL_ECONOMICS_UNAVAILABLE_TEXT = "Financial exposure is not calculated in this preliminary sample because deal value and compensation inputs are not confirmed.";
export const DEAL_ECONOMICS_INPUT_PROMPT_TEXT = "Provide EV and confirmed compensation inputs to calculate a structure-based risk envelope.";
export const DEAL_ECONOMICS_MISSING_INPUT_TEXT = "Missing input: EV / deal value and confirmed compensation assumptions.";
export const DEAL_ECONOMICS_DEAL_VALUE_PROMPT_TEXT = "Provide deal value to activate the risk envelope.";
export const DEAL_ECONOMICS_SINGLE_CURRENCY_TEXT = "Deal Economics must use one currency for enterprise value and compensation. No FX conversion is applied.";
export const DEAL_ECONOMICS_VALID_ECS_REQUIRED_TEXT = "Risk-envelope calculation requires a valid ECS score.";
export const DEAL_ECONOMICS_SUPPORTED_CURRENCY_TEXT = "Deal Economics risk-envelope calculation requires USD or EUR currency.";
export const DEAL_ECONOMICS_PERSONNEL_REQUIRED_TEXT = "requires personnel-at-risk and per-person compensation";

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

function parseDealEconomicsInteger(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
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

function dealEconomicsRawCurrency(session, key) {
  return String(dealEconomicsValue(session, key) ?? "").trim();
}

function supportedDealEconomicsCurrency(currency) {
  return currency === "USD" || currency === "EUR";
}

function lineWithOpenEndedHigh(label, lowValue, highValue, currency, highOpenEnded) {
  const highText = describeOpenEndedHigh(formatMillions(highValue, currency), highOpenEnded);
  return `${label}: Low ${formatMillions(lowValue, currency)} / High ${highText}.`;
}

function riskEnvelopeBaseScore(options = {}) {
  return typeof options.baseEcsScore === "number" && Number.isFinite(options.baseEcsScore)
    ? options.baseEcsScore
    : null;
}

function riskEnvelopeUnavailable(lines, extra = {}) {
  return Object.freeze({
    available: Boolean(extra.available),
    inputsAvailable: Boolean(extra.inputsAvailable),
    calculated: false,
    enterpriseValue: extra.enterpriseValue,
    compensation: extra.compensation,
    keyPersonnelAtRisk: extra.keyPersonnelAtRisk ?? null,
    bandName: extra.bandName ?? null,
    lines: Object.freeze(lines),
    text: lines[0] ?? "",
    missingInput: lines[1] ?? "",
    prompt: lines[2] ?? "",
  });
}

export function buildDealEconomicsReport(session = {}, options = {}) {
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
    label: "Average annual compensation per key person provided",
  });
  const keyPersonnelAtRisk = parseDealEconomicsInteger(dealEconomicsValue(session, "keyPersonnelAtRisk"));
  const baseEcsScore = riskEnvelopeBaseScore(options);
  const band = getEcsValuationBand(baseEcsScore);
  const enterpriseRawCurrency = dealEconomicsRawCurrency(session, "enterpriseValueCurrency");
  const compensationRawCurrency = dealEconomicsRawCurrency(session, "compensationCurrency");
  const hasCurrencyMismatch = Boolean(
    enterpriseRawCurrency
    && compensationRawCurrency
    && enterpriseRawCurrency !== compensationRawCurrency,
  );
  const calculationCurrency = enterpriseValue.currency || compensation.currency;
  const canUseEvForEnvelope = enterpriseValue.provided && normalizeMoneyToMillions(enterpriseValue.amount) !== null;
  const commonReportState = {
    enterpriseValue,
    compensation,
    keyPersonnelAtRisk,
    available: enterpriseValue.provided || compensation.provided || keyPersonnelAtRisk !== null,
    inputsAvailable: false,
  };

  if (!enterpriseValue.provided) {
    return riskEnvelopeUnavailable([
      ...(compensation.provided ? [compensation.line] : []),
      DEAL_ECONOMICS_DEAL_VALUE_PROMPT_TEXT,
    ], commonReportState);
  }

  if (hasCurrencyMismatch) {
    return riskEnvelopeUnavailable([
      enterpriseValue.line,
      ...(compensation.provided ? [compensation.line] : []),
      DEAL_ECONOMICS_SINGLE_CURRENCY_TEXT,
    ], commonReportState);
  }

  if (!supportedDealEconomicsCurrency(calculationCurrency)) {
    return riskEnvelopeUnavailable([
      enterpriseValue.line,
      DEAL_ECONOMICS_SUPPORTED_CURRENCY_TEXT,
    ], commonReportState);
  }

  if (!band || baseEcsScore === null) {
    return riskEnvelopeUnavailable([
      enterpriseValue.line,
      DEAL_ECONOMICS_VALID_ECS_REQUIRED_TEXT,
    ], commonReportState);
  }

  if (!canUseEvForEnvelope) {
    return riskEnvelopeUnavailable([
      enterpriseValue.line,
      DEAL_ECONOMICS_DEAL_VALUE_PROMPT_TEXT,
    ], commonReportState);
  }

  if (!compensation.provided || keyPersonnelAtRisk === null) {
    const enterpriseValueMillions = normalizeMoneyToMillions(enterpriseValue.amount);
    const evDiscountLow = enterpriseValueMillions * band.evDiscountLowRate;
    const evDiscountHigh = enterpriseValueMillions * band.evDiscountHighRate;
    const earnOutExposureLow = enterpriseValueMillions * band.earnOutExposureLowRate;
    const earnOutExposureHigh = enterpriseValueMillions * band.earnOutExposureHighRate;
    return riskEnvelopeUnavailable([
      enterpriseValue.line,
      `ECS valuation band: ${band.name} (${baseEcsScore}).`,
      lineWithOpenEndedHigh("EV Discount", evDiscountLow, evDiscountHigh, calculationCurrency, Boolean(band.evDiscountHighOpenEnded)),
      lineWithOpenEndedHigh("Earn-Out Exposure", earnOutExposureLow, earnOutExposureHigh, calculationCurrency, Boolean(band.earnOutExposureHighOpenEnded)),
      `Talent Cost: ${DEAL_ECONOMICS_PERSONNEL_REQUIRED_TEXT}.`,
      `Total Risk Envelope: ${DEAL_ECONOMICS_PERSONNEL_REQUIRED_TEXT}.`,
      DEAL_ECONOMICS_DISCLAIMER,
    ], { ...commonReportState, bandName: band.name });
  }

  const calculation = calculateDealEconomicsRiskEnvelope({
    enterpriseValue: enterpriseValue.amount,
    keyPersonnelAtRisk,
    averageAnnualCompensationPerKeyPerson: compensation.amount,
    baseEcsScore,
  });

  if (!calculation.calculated) {
    return riskEnvelopeUnavailable([
      enterpriseValue.line,
      compensation.line,
      calculation.missing.includes("baseEcsScore")
        ? DEAL_ECONOMICS_VALID_ECS_REQUIRED_TEXT
        : DEAL_ECONOMICS_DEAL_VALUE_PROMPT_TEXT,
    ], commonReportState);
  }

  const totalHighOpenEnded = calculation.evDiscountHighOpenEnded
    || calculation.earnOutExposureHighOpenEnded
    || calculation.costPerDepartureHighOpenEnded
    || calculation.estimatedTalentLossHighOpenEnded;
  const lines = [
    enterpriseValue.line,
    compensation.line,
    `Key personnel at risk: ${keyPersonnelAtRisk}.`,
    `ECS valuation band: ${calculation.bandName} (${calculation.baseEcsScore}).`,
    lineWithOpenEndedHigh("EV Discount", calculation.evDiscountLow, calculation.evDiscountHigh, calculationCurrency, calculation.evDiscountHighOpenEnded),
    lineWithOpenEndedHigh("Earn-Out Exposure", calculation.earnOutExposureLow, calculation.earnOutExposureHigh, calculationCurrency, calculation.earnOutExposureHighOpenEnded),
    lineWithOpenEndedHigh("Talent Cost", calculation.talentCostLow, calculation.talentCostHigh, calculationCurrency, calculation.costPerDepartureHighOpenEnded),
    lineWithOpenEndedHigh("Total Risk Envelope", calculation.riskEnvelopeLow, calculation.riskEnvelopeHigh, calculationCurrency, totalHighOpenEnded),
    DEAL_ECONOMICS_DISCLAIMER,
  ];

  return Object.freeze({
    available: true,
    inputsAvailable: true,
    calculated: true,
    enterpriseValue,
    compensation,
    keyPersonnelAtRisk,
    bandName: calculation.bandName,
    calculation,
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
