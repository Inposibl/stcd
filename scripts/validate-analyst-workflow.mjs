import assert from "node:assert/strict";
import {
  ANALYST_REVIEW_STATUSES,
  applyAnalystReview,
  attachAnalystWorksheetReview,
  buildAnalystWorksheet,
} from "../src/flow/analystWorkflow.js";

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

function score(primaryEnvironmentCode, responses, confidence = "high") {
  return Object.freeze({
    valid: true,
    primaryEnvironmentCode,
    topEnvironmentCode: primaryEnvironmentCode,
    signalStrength: confidence === "low" ? "weak" : "confirmed",
    confidence,
    missingQuestionIds: Object.freeze([]),
    effectiveAnswerCount: responses.length,
    totalEvidenceWeight: responses.reduce((sum, item) => sum + item.weight, 0),
    evidenceQuality: Object.freeze({
      confidence,
      directObservationCount: responses.filter((item) => item.evidenceType === "direct_observation").length,
      documentSupportedCount: 0,
      evidenceSupportedShare: confidence === "low" ? 0 : 1,
      reliabilityFlagCount: responses.filter((item) => item.reliabilityFlags.length > 0).length,
      reliabilityFlagRate: responses.length
        ? responses.filter((item) => item.reliabilityFlags.length > 0).length / responses.length
        : 0,
    }),
    questionResponses: Object.freeze(responses),
  });
}

const targetObservationResponses = Object.freeze([
  response("observed-pattern", {
    questionId: "o1",
    evidenceType: "inference",
    knowledgeLevel: "pattern_based",
    confidence: "low",
    directObservationGate: "no",
    reliabilityFlags: ["no_direct_knowledge"],
    weight: 0.2,
  }),
  response("observed-pattern", {
    questionId: "o2",
    evidenceType: "inference",
    knowledgeLevel: "pattern_based",
    confidence: "low",
    directObservationGate: "no",
    reliabilityFlags: ["no_direct_knowledge"],
    weight: 0.2,
  }),
]);

const session = Object.freeze({
  sessionId: "analyst-workflow-smoke",
  acquirer2A: Object.freeze({
    completed: true,
    score: score("acquirer-pattern", Object.freeze([response("acquirer-pattern", { questionId: "a1" })])),
  }),
  targetObservation: Object.freeze({
    completed: true,
    score: score("observed-pattern", targetObservationResponses, "low"),
  }),
  target2B: Object.freeze({
    completed: true,
    finalScore: score("diagnostic-pattern", Object.freeze([response("diagnostic-pattern", { questionId: "d1" })])),
  }),
  targetSelfAssessment: Object.freeze({
    completed: true,
    score: score("self-pattern", Object.freeze([response("self-pattern", { questionId: "s1" })])),
  }),
});

assert.ok(ANALYST_REVIEW_STATUSES.includes("confirmed"));
const worksheet = buildAnalystWorksheet(session, null, { generatedAt: "2026-05-01T00:00:00.000Z" });
assert.equal(worksheet.version, "newlogic-analyst-workflow-v1");
assert.ok(worksheet.findingCount >= 5, "worksheet must include contradiction findings");
assert.equal(worksheet.reviewedCount, 0);
assert.equal(worksheet.pendingCount, worksheet.findingCount);
assert.ok(worksheet.riskOutputs.length > 0, "pending findings still produce provisional risk outputs");
assert.ok(worksheet.riskOutputs.some((risk) => risk.riskCategory === "Integration Fracture Risk"));

const firstFindingId = worksheet.items[0].findingId;
const reviewed = applyAnalystReview(worksheet, firstFindingId, {
  status: "confirmed",
  analystSeverity: "high",
  analystConfidence: "high",
  analystRationale: "Confirmed by diligence interview pattern.",
  recommendation: "Escalate decision-rights review before close.",
}, "2026-05-01T01:00:00.000Z");
assert.equal(reviewed.reviewedCount, 1);
assert.equal(reviewed.pendingCount, worksheet.findingCount - 1);
assert.equal(reviewed.items.find((item) => item.findingId === firstFindingId).status, "confirmed");
assert.equal(reviewed.items.find((item) => item.findingId === firstFindingId).analystRationale, "Confirmed by diligence interview pattern.");
assert.ok(reviewed.riskOutputs[0].score >= worksheet.riskOutputs[0].score, "confirmed high-confidence risk should not weaken the risk output");

const attached = attachAnalystWorksheetReview(session, firstFindingId, {
  status: "not_material",
  analystSeverity: "low",
  analystConfidence: "medium",
}, "2026-05-01T02:00:00.000Z");
assert.equal(attached.session.analystWorksheet.items.find((item) => item.findingId === firstFindingId).status, "not_material");
assert.equal(attached.analystWorksheet.reviewedCount, 1);

console.log("Analyst workflow smoke test passed");
