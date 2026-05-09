import assert from "node:assert/strict";
import {
  FINAL_REPORT_SECTION_ORDER,
  buildFinalReportStructure,
} from "../src/flow/finalReportEngine.js";
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

console.log("Final report structure smoke test passed");
