import assert from "node:assert/strict";
import { buildRiskOutputReport } from "../src/flow/riskOutputEngine.js";
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
      documentSupportedCount: 0,
      evidenceSupportedShare: overrides.evidenceSupportedShare ?? 1,
      reliabilityFlagCount: responses.filter((item) => item.reliabilityFlags.length > 0).length,
      reliabilityFlagRate: responses.length
        ? responses.filter((item) => item.reliabilityFlags.length > 0).length / responses.length
        : 0,
    }),
    questionResponses: Object.freeze(responses),
  });
}

const direct = Object.freeze([response("direct-pattern", { questionId: "d1" })]);
const session = Object.freeze({
  sessionId: "risk-output-smoke",
  acquirer2A: Object.freeze({ completed: true, score: score("acquirer-pattern", direct) }),
  targetObservation: Object.freeze({ completed: true, score: score("observed-pattern", direct) }),
  target2B: Object.freeze({ completed: true, finalScore: score("diagnostic-pattern", direct) }),
  targetSelfAssessment: Object.freeze({ completed: true, score: score("self-pattern", direct) }),
});

const worksheet = buildAnalystWorksheet(session, null, { generatedAt: "2026-05-01T00:00:00.000Z" });
assert.ok(worksheet.items.length > 0, "risk output smoke requires analyst findings");
const integrationFinding = worksheet.items.find((item) => item.riskCategories.includes("Integration Fracture Risk")) ?? worksheet.items[0];

const reviewedSession = attachAnalystWorksheetReview(session, integrationFinding.findingId, {
  status: "confirmed",
  analystSeverity: "high",
  analystConfidence: "high",
  analystRationale: "Confirmed by cross-role divergence.",
  recommendation: "Resolve decision rights before close.",
}, "2026-05-01T01:00:00.000Z").session;

const evidenceSession = attachEvidenceItem(reviewedSession, {
  title: "Decision-rights escalation matrix",
  itemType: "document",
  documentType: "decision_rights",
  sourceParty: "acquirer",
  storageReference: "Data room / Integration / decision-rights",
  reviewStatus: "verified",
  confidence: "high",
  relationship: "supports",
  analystExtract: "Matrix confirms unresolved authority handoffs for post-close operating decisions.",
  relevantRiskCategories: ["Integration Fracture Risk", "Decision-Rights Conflict Risk"],
  relatedFindingIds: [integrationFinding.findingId],
}, "2026-05-01T02:00:00.000Z").session;

const report = buildRiskOutputReport(evidenceSession, { generatedAt: "2026-05-01T03:00:00.000Z" });
assert.equal(report.version, "newlogic-risk-output-v1");
assert.equal(report.outputCount, 10);
assert.equal(report.outputs.length, 10);
assert.deepEqual(report.outputs.map((output) => output.id), [
  "integration_fracture",
  "leadership_accountability",
  "key_person_retention",
  "founder_dependency",
  "decision_rights_conflict",
  "governance_risk",
  "political_protection",
  "talent_flight",
  "management_performance_drop",
  "months_6_18_failure",
]);
assert.ok(report.rankedOutputs[0].score >= report.rankedOutputs.at(-1).score);
const integrationOutput = report.outputs.find((output) => output.id === "integration_fracture");
assert.equal(integrationOutput.findingCount > 0, true);
assert.equal(integrationOutput.verifiedEvidenceItemCount, 1);
assert.equal(integrationOutput.confidence, "cannot_determine");
assert.equal(report.confidenceCap, "cannot_determine");
assert.ok(integrationOutput.recommendations.includes("Resolve decision rights before close."));

const decisionOutput = report.outputs.find((output) => output.id === "decision_rights_conflict");
assert.equal(decisionOutput.verifiedEvidenceItemCount, 1);
assert.equal(report.evidenceCoverage.verifiedCount, 1);

console.log("Risk output smoke test passed");
