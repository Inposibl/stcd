import assert from "node:assert/strict";
import { buildContradictionReport } from "../src/flow/contradictionEngine.js";
import { attachPreliminaryAssessment } from "../src/flow/targetInviteFlow.js";

function classifiedResponse(signalCode, overrides = {}) {
  return Object.freeze({
    questionId: overrides.questionId ?? "q",
    respondentId: overrides.respondentId ?? "respondent",
    selectedOption: overrides.selectedOption ?? "A",
    evidenceType: overrides.evidenceType ?? "direct_observation",
    knowledgeLevel: overrides.knowledgeLevel ?? "first_hand",
    confidence: overrides.confidence ?? "high",
    directObservationGate: overrides.directObservationGate ?? "yes",
    reliabilityFlags: Object.freeze(overrides.reliabilityFlags ?? []),
    missing: false,
    excludedFromPrimaryScoring: false,
    signalCodes: Object.freeze([signalCode]),
    weight: overrides.weight ?? 1,
  });
}

function score(primaryEnvironmentCode, responses, overrides = {}) {
  return Object.freeze({
    valid: true,
    primaryEnvironmentCode,
    topEnvironmentCode: primaryEnvironmentCode,
    secondaryEnvironmentCode: overrides.secondaryEnvironmentCode ?? null,
    signalStrength: overrides.signalStrength ?? "confirmed",
    signalBadge: "** confirmed signal pattern",
    confidence: overrides.confidence ?? "high",
    answeredQuestionCount: responses.length,
    effectiveAnswerCount: responses.length,
    totalEvidenceWeight: responses.reduce((sum, response) => sum + response.weight, 0),
    missingQuestionIds: Object.freeze([]),
    evidenceQuality: Object.freeze({
      confidence: overrides.confidence ?? "high",
      directObservationCount: responses.filter((response) => response.evidenceType === "direct_observation").length,
      documentSupportedCount: responses.filter((response) => response.evidenceType === "document_supported").length,
      evidenceSupportedShare: overrides.evidenceSupportedShare ?? 1,
      reliabilityFlagCount: responses.filter((response) => response.reliabilityFlags.length > 0).length,
      reliabilityFlagRate: responses.length
        ? responses.filter((response) => response.reliabilityFlags.length > 0).length / responses.length
        : 0,
    }),
    questionResponses: Object.freeze(responses),
  });
}

const directAcquirerResponses = Object.freeze(
  Array.from({ length: 4 }, (_, index) => classifiedResponse("acquirer-signal", { questionId: `a${index}` })),
);
const indirectTargetResponses = Object.freeze(
  Array.from({ length: 4 }, (_, index) => classifiedResponse("observed-target-signal", {
    questionId: `o${index}`,
    evidenceType: "inference",
    knowledgeLevel: "pattern_based",
    confidence: "low",
    directObservationGate: "no",
    reliabilityFlags: ["no_direct_knowledge"],
    weight: 0.2,
  })),
);
const targetDiagnosticResponses = Object.freeze(
  Array.from({ length: 4 }, (_, index) => classifiedResponse("diagnostic-target-signal", { questionId: `d${index}` })),
);
const targetSelfResponses = Object.freeze(
  Array.from({ length: 4 }, (_, index) => classifiedResponse("self-target-signal", {
    questionId: `s${index}`,
    evidenceType: "hypothetical",
    knowledgeLevel: "speculative",
    confidence: "high",
    directObservationGate: "yes",
    reliabilityFlags: ["hypothetical"],
    weight: 0.1,
  })),
);

const session = Object.freeze({
  sessionId: "contradiction-smoke",
  dealContext: Object.freeze({
    completed: true,
    data: Object.freeze({
      acquirerName: "Acquirer Corp",
      targetName: "Target Inc.",
    }),
  }),
  acquirer2A: Object.freeze({
    completed: true,
    score: score("acquirer-signal", directAcquirerResponses),
  }),
  targetObservation: Object.freeze({
    completed: true,
    score: score("observed-target-signal", indirectTargetResponses, {
      confidence: "low",
      evidenceSupportedShare: 0,
    }),
    outputContext: Object.freeze({ observationPosition: "Acquirer diligence lead" }),
  }),
  target2B: Object.freeze({
    completed: true,
    finalScore: score("diagnostic-target-signal", targetDiagnosticResponses),
  }),
  targetSelfAssessment: Object.freeze({
    completed: true,
    score: score("self-target-signal", targetSelfResponses, {
      evidenceSupportedShare: 0,
    }),
  }),
});

const report = buildContradictionReport(session, { generatedAt: "2026-05-01T00:00:00.000Z" });
assert.equal(report.completed, true);
assert.equal(report.version, "newlogic-contradiction-engine-v1");
assert.ok(report.summary.findingCount >= 8, "contradiction report must surface pair divergences and reliability risks");
assert.ok(report.summary.highSeverityCount >= 3, "high-severity contradictions must remain visible");
assert.ok(report.summary.contradictionCount >= 5, "cross-source divergences must be counted");
assert.ok(report.summary.reliabilityRiskCount >= 4, "evidence reliability concerns must be counted separately");
assert.ok(report.findings.some((finding) => finding.type === "acquirer_target_disagreement"));
assert.ok(report.findings.some((finding) => finding.type === "target_observed_self_divergence"));
assert.ok(report.findings.some((finding) => finding.type === "indirect_answers_driving_score"));
assert.ok(report.findings.some((finding) => finding.type === "reliability_flag_concentration"));
assert.ok(report.findings.some((finding) => finding.type === "no_direct_knowledge_concentration"));
assert.ok(report.findings.some((finding) => finding.type === "evidence_basis_mismatch"));
const evidenceMismatchFindings = report.findings.filter((finding) => finding.type === "evidence_basis_mismatch");
assert.ok(evidenceMismatchFindings.length > 0);
assert.equal(
  new Set(evidenceMismatchFindings.map((finding) => finding.title)).size,
  evidenceMismatchFindings.length,
  "source-specific evidence mismatch findings must not render with duplicate headlines",
);
assert.ok(report.findings.every((finding) => finding.requiresAnalystReview === true));

const preliminary = attachPreliminaryAssessment(session, "2026-05-01T00:00:00.000Z").preliminaryAssessment;
assert.equal(preliminary.completed, true);
assert.equal(preliminary.contradictionReport.version, report.version);
assert.ok(preliminary.contradictionReport.summary.findingCount >= report.summary.contradictionCount);

console.log("Contradiction engine smoke test passed");
