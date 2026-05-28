import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DEAL_ECONOMICS_DEAL_VALUE_PROMPT_TEXT,
  DEAL_ECONOMICS_UNAVAILABLE_TEXT,
  DEAL_ECONOMICS_SINGLE_CURRENCY_TEXT,
  DEAL_ECONOMICS_SUPPORTED_CURRENCY_TEXT,
  DEAL_ECONOMICS_VALID_ECS_REQUIRED_TEXT,
  FINAL_REPORT_SECTION_ORDER,
  buildDealEconomicsReport,
  buildFinalReportStructure,
} from "../src/flow/finalReportEngine.js";
import {
  DEAL_ECONOMICS_DISCLAIMER,
  DEAL_ECONOMICS_FORMULA_DETAILS,
  DEAL_ECONOMICS_FORMULA_SCHEMA,
  DEAL_ECONOMICS_FORMULA_SPEC,
  DEAL_ECONOMICS_FORMULA_SPEC_METADATA,
  DEAL_ECONOMICS_SOURCE_SHEETS,
  DEAL_ECONOMICS_TERMINOLOGY,
  DEAL_ECONOMICS_TALENT_MULTIPLIERS,
  DEAL_ECONOMICS_WORKBOOK_EXAMPLE,
  ECS_VALUATION_BANDS,
} from "../src/data/dealEconomicsFormulaSpec.js";
import {
  calculateDealEconomicsRiskEnvelope,
  describeOpenEndedHigh,
  formatMillions,
  getEcsValuationBand,
  normalizeMoneyToMillions,
} from "../src/flow/dealEconomicsRiskEnvelope.js";
import { attachAnalystWorksheetReview, buildAnalystWorksheet } from "../src/flow/analystWorkflow.js";
import { attachEvidenceItem } from "../src/flow/evidenceCapture.js";

function response(signalCode, overrides = {}) {
  return Object.freeze({
    questionId: overrides.questionId ?? "q",
    evidenceType: overrides.evidenceType ?? "direct_observation",
    knowledgeLevel: overrides.knowledgeLevel ?? "first_hand",
    confidence: overrides.confidence ?? "high",
    directObservationGate: overrides.directObservationGate ?? "yes",
    reliabilityFlags: Object.freeze(overrides.reliabilityFlags ?? []),
    signalCodes: Object.freeze([signalCode]),
    weight: overrides.weight ?? 1,
    missing: false,
    excludedFromPrimaryScoring: false,
  });
}

function score(primaryEnvironmentCode, responses, overrides = {}) {
  return Object.freeze({
    valid: true,
    primaryEnvironmentCode,
    topEnvironmentCode: primaryEnvironmentCode,
    signalStrength: overrides.signalStrength ?? "confirmed",
    confidence: overrides.confidence ?? "high",
    missingQuestionIds: Object.freeze([]),
    effectiveAnswerCount: responses.length,
    totalEvidenceWeight: responses.reduce((sum, item) => sum + item.weight, 0),
    evidenceQuality: Object.freeze({
      confidence: overrides.confidence ?? "high",
      directObservationCount: responses.filter((item) => item.evidenceType === "direct_observation").length,
      documentSupportedCount: responses.filter((item) => item.evidenceType === "document_supported").length,
      evidenceSupportedShare: overrides.evidenceSupportedShare ?? 1,
      reliabilityFlagCount: responses.filter((item) => item.reliabilityFlags.length > 0).length,
      reliabilityFlagRate: responses.length
        ? responses.filter((item) => item.reliabilityFlags.length > 0).length / responses.length
        : 0,
    }),
    questionResponses: Object.freeze(responses),
  });
}

const baseSession = Object.freeze({
  sessionId: "final-report-smoke",
  dealContext: Object.freeze({
    completed: true,
    data: Object.freeze({
      acquirerName: "Acquirer Holdings",
      targetName: "Target Operating Co",
      dealType: "platform_acquisition",
      respondentSide: "acquirer",
      respondentRole: "integration_lead",
      respondentSeniority: "executive",
      respondentFunction: "Integration",
      respondentAccessLevel: "diligence_and_integration",
    }),
  }),
  acquirer2A: Object.freeze({
    completed: true,
    score: score("acquirer-pattern", Object.freeze([
      response("acquirer-pattern", { questionId: "a1" }),
      response("acquirer-pattern", { questionId: "a2", reliabilityFlags: ["evasive"] }),
    ])),
  }),
  targetObservation: Object.freeze({
    completed: true,
    score: score("observed-pattern", Object.freeze([
      response("observed-pattern", { questionId: "o1" }),
      response("observed-pattern", { questionId: "o2", evidenceType: "reported_by_others", knowledgeLevel: "second_hand" }),
    ])),
  }),
  target2B: Object.freeze({
    completed: true,
    finalScore: score("diagnostic-pattern", Object.freeze([
      response("diagnostic-pattern", { questionId: "d1" }),
      response("diagnostic-pattern", { questionId: "d2", reliabilityFlags: ["speaks_for_group_without_access"] }),
    ])),
  }),
  targetSelfAssessment: Object.freeze({
    completed: true,
    score: score("self-pattern", Object.freeze([
      response("self-pattern", { questionId: "s1" }),
      response("self-pattern", { questionId: "s2", evidenceType: "hypothetical", knowledgeLevel: "speculative", confidence: "low" }),
    ]), { confidence: "medium" }),
  }),
});

const worksheet = buildAnalystWorksheet(baseSession, null, { generatedAt: "2026-05-01T00:00:00.000Z" });
assert.ok(worksheet.items.length > 0, "final report requires analyst findings in smoke session");

const reviewedFinding = worksheet.items.find((item) => item.riskCategories.includes("Integration Fracture Risk")) ?? worksheet.items[0];
const reviewedSession = attachAnalystWorksheetReview(baseSession, reviewedFinding.findingId, {
  status: "confirmed",
  analystSeverity: "high",
  analystConfidence: "high",
  analystRationale: "Material cross-role divergence confirmed for final report smoke coverage.",
  recommendation: "Resolve decision rights and reporting accountability before close.",
}, "2026-05-01T01:00:00.000Z").session;

const evidenceSession = attachEvidenceItem(reviewedSession, {
  title: "Decision-rights review pack",
  itemType: "document",
  documentType: "decision_rights",
  sourceParty: "acquirer",
  storageReference: "Diligence room / Integration / decision rights",
  reviewStatus: "verified",
  confidence: "high",
  relationship: "supports",
  analystExtract: "Decision authority and escalation handoffs remain unresolved for Day 1 and months 6-18.",
  relevantRiskCategories: ["Integration Fracture Risk", "Decision-Rights Conflict Risk"],
  relatedFindingIds: [reviewedFinding.findingId],
}, "2026-05-01T02:00:00.000Z").session;

const deliverable = Object.freeze({
  ready: true,
  acquirerAlias: "Acquirer operating pattern",
  targetAlias: "Target operating pattern",
  compatibilityRange: "70-80",
  riskBand: "HIGH RISK",
  narrative: Object.freeze({
    headline: "Material integration risk requires analyst interpretation.",
    situation: "The current pair shows meaningful operating divergence.",
    implication: "Integration control design should be completed before close.",
  }),
  protocol: Object.freeze({
    dealInsights: Object.freeze([
      Object.freeze({
        title: "Decision-rights control",
        text: "Define escalation paths, protected work boundaries, and authority handoffs before Day 1.",
      }),
    ]),
  }),
});

const report = buildFinalReportStructure(evidenceSession, deliverable, {
  generatedAt: "2026-05-01T03:00:00.000Z",
});

assert.equal(report.version, "newlogic-final-report-v1");
assert.equal(report.completed, true);
assert.equal(report.sectionCount, 11);
assert.deepEqual(report.sectionOrder, FINAL_REPORT_SECTION_ORDER);
assert.deepEqual(report.sections.map((section) => section.id), FINAL_REPORT_SECTION_ORDER);

for (const section of report.sections) {
  assert.ok(section.title, `section ${section.id} has title`);
  assert.ok(section.summary, `section ${section.id} has summary`);
}

const formalRiskOutputs = report.sections.find((section) => section.id === "formal_risk_outputs");
assert.equal(formalRiskOutputs.records.length, 10);
assert.equal(report.riskOutputReport.outputCount, 10);
assert.ok(formalRiskOutputs.items.some((item) => item.includes("Integration Fracture Risk")));

const evidenceCoverage = report.sections.find((section) => section.id === "evidence_coverage");
assert.ok(evidenceCoverage.items.some((item) => item.includes("verified")));
assert.equal(report.evidenceCoverage.verifiedCount, 1);

const contradictionReview = report.sections.find((section) => section.id === "contradiction_review");
assert.ok(contradictionReview.items.length > 0);

const actionRoadmap = report.sections.find((section) => section.id === "actions_roadmap");
assert.ok(actionRoadmap.items.some((item) => item.includes("Resolve decision rights")));

const limitations = report.sections.find((section) => section.id === "limitations");
assert.ok(limitations.items.some((item) => item.includes("respondent answers as factual truth")));

const auditRecord = report.sections.find((section) => section.id === "audit_record");
assert.ok(auditRecord.items.some((item) => item.includes("newlogic-final-report-v1")));

const publicPayload = JSON.stringify(report);
assert.equal(/\badmin\b|source-file|source file|\bcorpus\b|internal validation|route scaffold|source-bound/i.test(publicPayload), false);

assert.deepEqual(DEAL_ECONOMICS_FORMULA_SPEC.metadata, DEAL_ECONOMICS_FORMULA_SPEC_METADATA);
assert.deepEqual(DEAL_ECONOMICS_FORMULA_SPEC.sourceSheets, DEAL_ECONOMICS_SOURCE_SHEETS);
assert.equal(DEAL_ECONOMICS_FORMULA_SPEC_METADATA.sourceWorkbookSha256, "9DC0B85F194B7A48873EA9407706CDEE99E367FA376043E13C751016FE0FA637");
assert.equal(DEAL_ECONOMICS_FORMULA_SPEC_METADATA.sourceWorkbookSizeBytes, 25216);
assert.equal(DEAL_ECONOMICS_FORMULA_SPEC_METADATA.runtimeEnabled, false);
assert.equal(DEAL_ECONOMICS_FORMULA_SPEC_METADATA.publicReportCalculationAllowed, false);
assert.equal(DEAL_ECONOMICS_FORMULA_SPEC_METADATA.unitConvention, "millions");
assert.equal(DEAL_ECONOMICS_FORMULA_DETAILS.formulaName, "ECS-to-Valuation Risk Envelope");
assert.equal(DEAL_ECONOMICS_FORMULA_DETAILS.formulaStatus, "canonical_spec_not_runtime_enabled");
assert.equal(DEAL_ECONOMICS_FORMULA_DETAILS.formulaScope, "public_base_ecs_only");
assert.deepEqual(DEAL_ECONOMICS_FORMULA_DETAILS.excludes, ["potentialECS", "ecsDelta", "postProtocolFigure"]);
assert.equal(DEAL_ECONOMICS_DISCLAIMER, "Order-of-magnitude estimates only. Not financial advice.");
assert.equal(DEAL_ECONOMICS_TERMINOLOGY.use, "EV Multiple");
assert.equal(DEAL_ECONOMICS_TERMINOLOGY.doNotUse, "EV Multiply");
assert.equal(DEAL_ECONOMICS_TALENT_MULTIPLIERS.replacementCostLowMultiplier, 2);
assert.equal(DEAL_ECONOMICS_TALENT_MULTIPLIERS.replacementCostHighMultiplier, 4);

assert.deepEqual(Object.keys(DEAL_ECONOMICS_FORMULA_SCHEMA), [
  "evDiscountLow",
  "evDiscountHigh",
  "discountedEvLow",
  "discountedEvHigh",
  "earnOutExposureLow",
  "earnOutExposureHigh",
  "talentCostLow",
  "talentCostHigh",
  "riskEnvelopeLow",
  "riskEnvelopeHigh",
]);

assert.deepEqual(ECS_VALUATION_BANDS.map((band) => [band.name, band.ecsMin, band.ecsMax]), [
  ["HIGH COMPATIBILITY", 80, 100],
  ["MODERATE-HIGH", 65, 79],
  ["MODERATE", 50, 64],
  ["MODERATE-LOW", 35, 49],
  ["HIGH RISK", 0, 34],
]);

const highRiskBand = ECS_VALUATION_BANDS.find((band) => band.name === "HIGH RISK");
assert.equal(highRiskBand.evDiscountHighOpenEnded, true);
assert.equal(highRiskBand.costPerDepartureHighOpenEnded, true);
assert.equal(highRiskBand.estimatedTalentLossHighOpenEnded, true);
assert.equal(highRiskBand.earnOutExposureHighOpenEnded, true);

const moderateLowBand = ECS_VALUATION_BANDS.find((band) => band.name === DEAL_ECONOMICS_WORKBOOK_EXAMPLE.bandName);
assert.equal(moderateLowBand.ecsMin, 35);
assert.equal(moderateLowBand.ecsMax, 49);
const exampleInputs = DEAL_ECONOMICS_WORKBOOK_EXAMPLE.inputs;
const exampleExpected = DEAL_ECONOMICS_WORKBOOK_EXAMPLE.expected;
const exampleCalculated = Object.freeze({
  ecsDelta: exampleInputs.potentialEcsScore - exampleInputs.baseEcsScore,
  evDiscountLow: exampleInputs.enterpriseValueMillions * moderateLowBand.evDiscountLowRate,
  evDiscountHigh: exampleInputs.enterpriseValueMillions * moderateLowBand.evDiscountHighRate,
  discountedEvLow: exampleInputs.enterpriseValueMillions - (exampleInputs.enterpriseValueMillions * moderateLowBand.evDiscountLowRate),
  discountedEvHigh: exampleInputs.enterpriseValueMillions - (exampleInputs.enterpriseValueMillions * moderateLowBand.evDiscountHighRate),
  synergyCaptureLow: moderateLowBand.synergyCaptureLowRate,
  synergyCaptureHigh: moderateLowBand.synergyCaptureHighRate,
  talentCostLow: exampleInputs.keyPersonnelAtRisk * exampleInputs.averageAnnualCompensationPerKeyPersonMillions * DEAL_ECONOMICS_TALENT_MULTIPLIERS.replacementCostLowMultiplier,
  talentCostHigh: exampleInputs.keyPersonnelAtRisk * exampleInputs.averageAnnualCompensationPerKeyPersonMillions * DEAL_ECONOMICS_TALENT_MULTIPLIERS.replacementCostHighMultiplier,
  earnOutExposureLow: exampleInputs.enterpriseValueMillions * moderateLowBand.earnOutExposureLowRate,
  earnOutExposureHigh: exampleInputs.enterpriseValueMillions * moderateLowBand.earnOutExposureHighRate,
});
assert.equal(exampleCalculated.ecsDelta, exampleExpected.ecsDelta);
assert.equal(exampleExpected.ecsDeltaPublicRuntimeExcluded, true);
assert.equal(exampleCalculated.evDiscountLow, 75);
assert.equal(exampleCalculated.evDiscountHigh, 125);
assert.equal(exampleCalculated.discountedEvLow, 425);
assert.equal(exampleCalculated.discountedEvHigh, 375);
assert.equal(exampleCalculated.synergyCaptureLow, 0.15);
assert.equal(exampleCalculated.synergyCaptureHigh, 0.39);
assert.equal(exampleCalculated.talentCostLow, 8);
assert.equal(exampleCalculated.talentCostHigh, 16);
assert.equal(exampleCalculated.earnOutExposureLow, 40);
assert.equal(exampleCalculated.earnOutExposureHigh, 100);
assert.equal(exampleCalculated.evDiscountLow + exampleCalculated.talentCostLow + exampleCalculated.earnOutExposureLow, 123);
assert.equal(exampleCalculated.evDiscountHigh + exampleCalculated.talentCostHigh + exampleCalculated.earnOutExposureHigh, 241);
assert.equal(exampleExpected.riskEnvelopeLow, 123);
assert.equal(exampleExpected.riskEnvelopeHigh, 241);

assert.equal(getEcsValuationBand(100).name, "HIGH COMPATIBILITY");
assert.equal(getEcsValuationBand(80).name, "HIGH COMPATIBILITY");
assert.equal(getEcsValuationBand(79).name, "MODERATE-HIGH");
assert.equal(getEcsValuationBand(65).name, "MODERATE-HIGH");
assert.equal(getEcsValuationBand(64).name, "MODERATE");
assert.equal(getEcsValuationBand(50).name, "MODERATE");
assert.equal(getEcsValuationBand(49).name, "MODERATE-LOW");
assert.equal(getEcsValuationBand(35).name, "MODERATE-LOW");
assert.equal(getEcsValuationBand(34).name, "HIGH RISK");
assert.equal(getEcsValuationBand(0).name, "HIGH RISK");
assert.equal(getEcsValuationBand(64.9).name, "MODERATE");
assert.equal(getEcsValuationBand(65.0).name, "MODERATE-HIGH");
assert.equal(getEcsValuationBand(34.9).name, "HIGH RISK");
assert.equal(getEcsValuationBand(35.0).name, "MODERATE-LOW");
assert.equal(getEcsValuationBand(-1), null);
assert.equal(getEcsValuationBand(101), null);
assert.equal(getEcsValuationBand(Number.NaN), null);
assert.equal(getEcsValuationBand(undefined), null);

assert.equal(normalizeMoneyToMillions(500000000), 500);
assert.equal(normalizeMoneyToMillions(0), 0);
assert.equal(normalizeMoneyToMillions(-1), null);
assert.equal(normalizeMoneyToMillions("500000000"), null);

const formulaWorkbookChecksum = calculateDealEconomicsRiskEnvelope({
  enterpriseValue: 500000000,
  keyPersonnelAtRisk: 4,
  averageAnnualCompensationPerKeyPerson: 1000000,
  baseEcsScore: 38,
});
assert.equal(formulaWorkbookChecksum.calculated, true);
assert.equal(formulaWorkbookChecksum.bandName, "MODERATE-LOW");
assert.equal(formulaWorkbookChecksum.unit, "millions");
assert.equal(formulaWorkbookChecksum.evDiscountLow, 75);
assert.equal(formulaWorkbookChecksum.evDiscountHigh, 125);
assert.equal(formulaWorkbookChecksum.discountedEvLow, 425);
assert.equal(formulaWorkbookChecksum.discountedEvHigh, 375);
assert.equal(formulaWorkbookChecksum.talentCostLow, 8);
assert.equal(formulaWorkbookChecksum.talentCostHigh, 16);
assert.equal(formulaWorkbookChecksum.earnOutExposureLow, 40);
assert.equal(formulaWorkbookChecksum.earnOutExposureHigh, 100);
assert.equal(formulaWorkbookChecksum.riskEnvelopeLow, 123);
assert.equal(formulaWorkbookChecksum.riskEnvelopeHigh, 241);
assert.equal(Object.hasOwn(formulaWorkbookChecksum, "potentialECS"), false);
assert.equal(Object.hasOwn(formulaWorkbookChecksum, "ecsDelta"), false);

const missingEvRiskEnvelope = calculateDealEconomicsRiskEnvelope({
  keyPersonnelAtRisk: 4,
  averageAnnualCompensationPerKeyPerson: 1000000,
  baseEcsScore: 38,
});
assert.equal(missingEvRiskEnvelope.calculated, false);
assert.ok(missingEvRiskEnvelope.missing.includes("enterpriseValue"));
const missingKeyPersonnelRiskEnvelope = calculateDealEconomicsRiskEnvelope({
  enterpriseValue: 500000000,
  averageAnnualCompensationPerKeyPerson: 1000000,
  baseEcsScore: 38,
});
assert.equal(missingKeyPersonnelRiskEnvelope.calculated, false);
assert.ok(missingKeyPersonnelRiskEnvelope.missing.includes("keyPersonnelAtRisk"));
const missingCompensationRiskEnvelope = calculateDealEconomicsRiskEnvelope({
  enterpriseValue: 500000000,
  keyPersonnelAtRisk: 4,
  baseEcsScore: 38,
});
assert.equal(missingCompensationRiskEnvelope.calculated, false);
assert.ok(missingCompensationRiskEnvelope.missing.includes("averageAnnualCompensationPerKeyPerson"));
const invalidEcsRiskEnvelope = calculateDealEconomicsRiskEnvelope({
  enterpriseValue: 500000000,
  keyPersonnelAtRisk: 4,
  averageAnnualCompensationPerKeyPerson: 1000000,
  baseEcsScore: 101,
});
assert.equal(invalidEcsRiskEnvelope.calculated, false);
assert.equal(invalidEcsRiskEnvelope.reason, "Invalid baseEcsScore.");
assert.ok(invalidEcsRiskEnvelope.missing.includes("baseEcsScore"));
assert.ok(calculateDealEconomicsRiskEnvelope({
  enterpriseValue: -1,
  keyPersonnelAtRisk: 4,
  averageAnnualCompensationPerKeyPerson: 1000000,
  baseEcsScore: 38,
}).missing.includes("enterpriseValue"));
assert.ok(calculateDealEconomicsRiskEnvelope({
  enterpriseValue: 500000000,
  keyPersonnelAtRisk: 1.5,
  averageAnnualCompensationPerKeyPerson: 1000000,
  baseEcsScore: 38,
}).missing.includes("keyPersonnelAtRisk"));

assert.equal(formatMillions(123, "USD"), "USD 123M");
assert.equal(formatMillions(0, "EUR"), "EUR 0M");
assert.equal(formatMillions(123, "GBP"), "Unsupported currency");
assert.equal(formatMillions(-1, "USD"), "Invalid amount");
assert.equal(describeOpenEndedHigh("USD 300M", true), ">= USD 300M");
assert.equal(describeOpenEndedHigh("USD 300M", false), "USD 300M");

const highRiskFormulaResult = calculateDealEconomicsRiskEnvelope({
  enterpriseValue: 500000000,
  keyPersonnelAtRisk: 4,
  averageAnnualCompensationPerKeyPerson: 1000000,
  baseEcsScore: 20,
});
assert.equal(highRiskFormulaResult.calculated, true);
assert.equal(highRiskFormulaResult.bandName, "HIGH RISK");
assert.equal(highRiskFormulaResult.evDiscountHighOpenEnded, true);
assert.equal(highRiskFormulaResult.earnOutExposureHighOpenEnded, true);
assert.equal(highRiskFormulaResult.openEnded.evDiscountHigh, true);
assert.equal(highRiskFormulaResult.openEnded.earnOutExposureHigh, true);

const noEconomicsReport = buildDealEconomicsReport({}, { baseEcsScore: 38 });
assert.equal(noEconomicsReport.calculated, false);
assert.ok(noEconomicsReport.lines.includes(DEAL_ECONOMICS_DEAL_VALUE_PROMPT_TEXT));
assert.equal(noEconomicsReport.lines.includes(DEAL_ECONOMICS_UNAVAILABLE_TEXT), false);

const evOnlyEconomicsReport = buildDealEconomicsReport({
  dealContext: {
    data: {
      enterpriseValue: 500000000,
      enterpriseValueCurrency: "USD",
      enterpriseValueStatus: "estimated",
      compensationStatus: "not_available",
    },
  },
}, { baseEcsScore: 38 });
assert.equal(evOnlyEconomicsReport.calculated, false);
assert.ok(evOnlyEconomicsReport.lines.includes("Enterprise value / deal value provided: USD 500,000,000 (estimated)."));
assert.ok(evOnlyEconomicsReport.lines.includes("ECS valuation band: MODERATE-LOW (38)."));
assert.ok(evOnlyEconomicsReport.lines.includes("EV Discount: Low USD 75M / High USD 125M."));
assert.ok(evOnlyEconomicsReport.lines.includes("Earn-Out Exposure: Low USD 40M / High USD 100M."));
assert.ok(evOnlyEconomicsReport.lines.includes("Talent Cost: requires personnel-at-risk and per-person compensation."));
assert.ok(evOnlyEconomicsReport.lines.includes("Total Risk Envelope: requires personnel-at-risk and per-person compensation."));
assert.ok(evOnlyEconomicsReport.lines.includes(DEAL_ECONOMICS_DISCLAIMER));

const compensationOnlyEconomicsReport = buildDealEconomicsReport({
  preliminaryAssessment: {
    dealContext: {
      enterpriseValueStatus: "not_available",
      compensationAssumptions: 4500000,
      compensationCurrency: "EUR",
      compensationStatus: "confirmed",
    },
  },
}, { baseEcsScore: 38 });
assert.equal(compensationOnlyEconomicsReport.calculated, false);
assert.ok(compensationOnlyEconomicsReport.lines.includes("Average annual compensation per key person provided: EUR 4,500,000 (confirmed)."));
assert.ok(compensationOnlyEconomicsReport.lines.includes(DEAL_ECONOMICS_DEAL_VALUE_PROMPT_TEXT));

const completeEconomicsReport = buildDealEconomicsReport({
  dealContext: {
    data: {
      enterpriseValue: 500000000,
      enterpriseValueCurrency: "USD",
      enterpriseValueStatus: "confirmed",
      keyPersonnelAtRisk: 4,
      compensationAssumptions: 1000000,
      compensationCurrency: "USD",
      compensationStatus: "estimated",
    },
  },
}, { baseEcsScore: 38 });
assert.equal(completeEconomicsReport.calculated, true);
assert.equal(completeEconomicsReport.bandName, "MODERATE-LOW");
assert.ok(completeEconomicsReport.lines.includes("Enterprise value / deal value provided: USD 500,000,000 (confirmed)."));
assert.ok(completeEconomicsReport.lines.includes("Average annual compensation per key person provided: USD 1,000,000 (estimated)."));
assert.ok(completeEconomicsReport.lines.includes("Key personnel at risk: 4."));
assert.ok(completeEconomicsReport.lines.includes("ECS valuation band: MODERATE-LOW (38)."));
assert.ok(completeEconomicsReport.lines.includes("EV Discount: Low USD 75M / High USD 125M."));
assert.ok(completeEconomicsReport.lines.includes("Earn-Out Exposure: Low USD 40M / High USD 100M."));
assert.ok(completeEconomicsReport.lines.includes("Talent Cost: Low USD 8M / High USD 16M."));
assert.ok(completeEconomicsReport.lines.includes("Total Risk Envelope: Low USD 123M / High USD 241M."));
assert.ok(completeEconomicsReport.lines.includes(DEAL_ECONOMICS_DISCLAIMER));
assert.equal(/potentialECS|Potential ECS|ECS Delta/i.test(completeEconomicsReport.lines.join("\n")), false);

const invalidBaseEcsEconomicsReport = buildDealEconomicsReport({
  dealContext: {
    data: {
      enterpriseValue: 500000000,
      enterpriseValueCurrency: "USD",
      enterpriseValueStatus: "confirmed",
      keyPersonnelAtRisk: 4,
      compensationAssumptions: 1000000,
      compensationCurrency: "USD",
      compensationStatus: "estimated",
    },
  },
}, { baseEcsScore: 101 });
assert.equal(invalidBaseEcsEconomicsReport.calculated, false);
assert.ok(invalidBaseEcsEconomicsReport.lines.includes(DEAL_ECONOMICS_VALID_ECS_REQUIRED_TEXT));

const mixedCurrencyEconomicsReport = buildDealEconomicsReport({
  dealContext: {
    data: {
      enterpriseValue: 500000000,
      enterpriseValueCurrency: "USD",
      enterpriseValueStatus: "confirmed",
      keyPersonnelAtRisk: 4,
      compensationAssumptions: 1000000,
      compensationCurrency: "EUR",
      compensationStatus: "estimated",
    },
  },
}, { baseEcsScore: 38 });
assert.equal(mixedCurrencyEconomicsReport.calculated, false);
assert.ok(mixedCurrencyEconomicsReport.lines.includes(DEAL_ECONOMICS_SINGLE_CURRENCY_TEXT));

const unsupportedCurrencyEconomicsReport = buildDealEconomicsReport({
  dealContext: {
    data: {
      enterpriseValue: 500000000,
      enterpriseValueCurrency: "GBP",
      enterpriseValueStatus: "confirmed",
      keyPersonnelAtRisk: 4,
      compensationAssumptions: 1000000,
      compensationCurrency: "GBP",
      compensationStatus: "estimated",
    },
  },
}, { baseEcsScore: 38 });
assert.equal(unsupportedCurrencyEconomicsReport.calculated, false);
assert.ok(unsupportedCurrencyEconomicsReport.lines.includes(DEAL_ECONOMICS_SUPPORTED_CURRENCY_TEXT));

const highRiskEconomicsReport = buildDealEconomicsReport({
  dealContext: {
    data: {
      enterpriseValue: 500000000,
      enterpriseValueCurrency: "USD",
      enterpriseValueStatus: "confirmed",
      keyPersonnelAtRisk: 4,
      compensationAssumptions: 1000000,
      compensationCurrency: "USD",
      compensationStatus: "estimated",
    },
  },
}, { baseEcsScore: 20 });
assert.equal(highRiskEconomicsReport.calculated, true);
assert.ok(highRiskEconomicsReport.lines.includes("ECS valuation band: HIGH RISK (20)."));
assert.ok(highRiskEconomicsReport.lines.includes("EV Discount: Low USD 175M / High >= USD 300M."));
assert.ok(highRiskEconomicsReport.lines.includes("Earn-Out Exposure: Low USD 100M / High >= USD 400M."));
assert.ok(highRiskEconomicsReport.lines.includes("Total Risk Envelope: Low USD 283M / High >= USD 716M."));

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
assert.ok(appSource.includes("report.economics.lines.map"), "HTML Deal Economics must render report.economics.lines");
assert.ok(appSource.includes("for (const line of report.economics.lines)"), "PDF Deal Economics must render report.economics.lines");
assert.ok(appSource.includes("economics: buildDealEconomicsReport(session, { baseEcsScore: score })"), "Public report must pass its displayed ECS score into Deal Economics.");

console.log("Final report structure smoke test passed");
