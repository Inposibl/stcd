import assert from "node:assert/strict";
import { buildTriageReport } from "../src/flow/triageEngine.js";
import { attachPreliminaryAssessment } from "../src/flow/targetInviteFlow.js";

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

function score(primarySignal, responses, overrides = {}) {
  const flagCount = responses.filter((item) => item.reliabilityFlags.length > 0).length;
  return Object.freeze({
    valid: true,
    primaryEnvironmentCode: primarySignal,
    topEnvironmentCode: primarySignal,
    secondaryEnvironmentCode: overrides.secondarySignal ?? null,
    signalStrength: overrides.signalStrength ?? "confirmed",
    confidence: overrides.confidence ?? "high",
    coPresence: overrides.coPresence === true,
    effectiveAnswerCount: responses.filter((item) => item.weight > 0).length,
    totalEvidenceWeight: responses.reduce((sum, item) => sum + item.weight, 0),
    missingQuestionIds: Object.freeze([]),
    evidenceQuality: Object.freeze({
      confidence: overrides.confidence ?? "high",
      directObservationCount: responses.filter((item) => item.evidenceType === "direct_observation").length,
      documentSupportedCount: responses.filter((item) => item.evidenceType === "document_supported").length,
      evidenceSupportedShare: overrides.evidenceSupportedShare ?? 1,
      reliabilityFlagCount: flagCount,
      reliabilityFlagRate: responses.length ? flagCount / responses.length : 0,
    }),
    questionResponses: Object.freeze(responses),
  });
}

const directResponses = Object.freeze([
  response("acquirer-pattern", { questionId: "a1" }),
  response("acquirer-pattern", { questionId: "a2" }),
]);

const weakResponses = Object.freeze([
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
    evidenceType: "unknown",
    knowledgeLevel: "not_known",
    confidence: "low",
    directObservationGate: "no",
    reliabilityFlags: ["contradicted_by_document"],
    weight: 0,
  }),
]);

const blockingSession = Object.freeze({
  sessionId: "triage-blocking-smoke",
  dealContext: Object.freeze({ completed: true, data: Object.freeze({ acquirerName: "Acquirer", targetName: "Target" }) }),
  acquirer2A: Object.freeze({ completed: true, score: score("acquirer-pattern", directResponses) }),
  targetObservation: Object.freeze({
    completed: true,
    score: score("observed-pattern", weakResponses, {
      confidence: "low",
      signalStrength: "weak",
      evidenceSupportedShare: 0,
    }),
  }),
  target2B: Object.freeze({ completed: true, finalScore: score("diagnostic-pattern", directResponses) }),
  targetSelfAssessment: Object.freeze({ completed: true, score: score("self-pattern", directResponses) }),
});

const blockingReport = buildTriageReport(blockingSession, { generatedAt: "2026-05-01T00:00:00.000Z" });
assert.equal(blockingReport.version, "newlogic-triage-engine-v1");
assert.equal(blockingReport.reliabilityTier, "HIGH");
assert.equal(blockingReport.contradictionTier, "BLOCKING");
assert.equal(blockingReport.effectiveTier, "BLOCKING");
assert.equal(blockingReport.routing.route, "practitioner_escalation");
assert.equal(blockingReport.routing.confidenceCap, "cannot_determine");
assert.ok(blockingReport.triggers.some((trigger) => trigger.id === "weak_signal"));
assert.ok(blockingReport.triggers.some((trigger) => trigger.id === "reliability_saturation"));
assert.ok(blockingReport.triggers.some((trigger) => trigger.id === "contradiction_blocking"));
assert.ok(blockingReport.accuracyChecks.some((check) => check.id === "direct_observation_gate" && check.status === "fail"));
assert.ok(blockingReport.accuracyChecks.some((check) => check.id === "evidence_quality" && check.status === "fail"));

const highReliabilitySession = Object.freeze({
  ...blockingSession,
  acquirer2A: Object.freeze({ completed: true, score: score("shared-pattern", directResponses) }),
  targetObservation: Object.freeze({
    completed: true,
    score: score("shared-pattern", weakResponses, {
      confidence: "low",
      signalStrength: "weak",
      evidenceSupportedShare: 0,
    }),
  }),
  target2B: Object.freeze({ completed: true, finalScore: score("shared-pattern", directResponses) }),
  targetSelfAssessment: Object.freeze({ completed: true, score: score("shared-pattern", directResponses) }),
});
const highReliabilityReport = buildTriageReport(highReliabilitySession, { generatedAt: "2026-05-01T00:00:00.000Z" });
assert.equal(highReliabilityReport.reliabilityTier, "HIGH");
assert.equal(highReliabilityReport.contradictionTier, "NONE");
assert.equal(highReliabilityReport.routing.route, "senior_analyst_review");
assert.equal(highReliabilityReport.routing.confidenceCap, "low");

const manyContradictionSession = Object.freeze({
  ...blockingSession,
  acquirer2A: Object.freeze({ completed: true, score: score("first-pattern", directResponses) }),
  targetObservation: Object.freeze({ completed: true, score: score("first-pattern", directResponses) }),
  target2B: Object.freeze({ completed: true, finalScore: score("second-pattern", directResponses) }),
  targetSelfAssessment: Object.freeze({ completed: true, score: score("second-pattern", directResponses) }),
});
const manyContradictionReport = buildTriageReport(manyContradictionSession, { generatedAt: "2026-05-01T00:00:00.000Z" });
assert.equal(manyContradictionReport.contradictionTier, "MANY");
assert.equal(manyContradictionReport.routing.route, "priority_analyst_review");

const standardSession = Object.freeze({
  ...blockingSession,
  acquirer2A: Object.freeze({ completed: true, score: score("shared-pattern", directResponses) }),
  targetObservation: Object.freeze({ completed: true, score: score("shared-pattern", directResponses) }),
  target2B: Object.freeze({ completed: true, finalScore: score("shared-pattern", directResponses) }),
  targetSelfAssessment: Object.freeze({ completed: true, score: score("shared-pattern", directResponses) }),
});
const standardReport = buildTriageReport(standardSession, { generatedAt: "2026-05-01T00:00:00.000Z" });
assert.equal(standardReport.reliabilityTier, "LOW");
assert.equal(standardReport.contradictionTier, "NONE");
assert.equal(standardReport.routing.route, "standard_analyst_review");
assert.equal(standardReport.triggers.length, 0);

const preliminary = attachPreliminaryAssessment(blockingSession, "2026-05-01T00:00:00.000Z").preliminaryAssessment;
assert.equal(preliminary.completed, true);
assert.equal(preliminary.triageReport.version, blockingReport.version);
assert.equal(preliminary.triageReport.routing.route, blockingReport.routing.route);

console.log("Triage engine smoke test passed");
