import assert from "node:assert/strict";
import {
  EVIDENCE_CAPTURE_VERSION,
  attachEvidenceItem,
  buildEvidenceCoverage,
  buildEvidenceItem,
  evidenceItemsFromSession,
  removeEvidenceItem,
  validateEvidenceItem,
} from "../src/flow/evidenceCapture.js";
import { buildAnalystWorksheet } from "../src/flow/analystWorkflow.js";

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

function score(primaryEnvironmentCode, responses) {
  return Object.freeze({
    valid: true,
    primaryEnvironmentCode,
    topEnvironmentCode: primaryEnvironmentCode,
    signalStrength: "confirmed",
    confidence: "high",
    missingQuestionIds: Object.freeze([]),
    effectiveAnswerCount: responses.length,
    totalEvidenceWeight: responses.reduce((sum, item) => sum + item.weight, 0),
    evidenceQuality: Object.freeze({
      confidence: "high",
      directObservationCount: responses.length,
      documentSupportedCount: 0,
      evidenceSupportedShare: 1,
      reliabilityFlagCount: 0,
      reliabilityFlagRate: 0,
    }),
    questionResponses: Object.freeze(responses),
  });
}

const session = Object.freeze({
  sessionId: "evidence-capture-smoke",
  acquirer2A: Object.freeze({ completed: true, score: score("acquirer-pattern", [response("acquirer-pattern")]) }),
  targetObservation: Object.freeze({ completed: true, score: score("observed-pattern", [response("observed-pattern")]) }),
  target2B: Object.freeze({ completed: true, finalScore: score("diagnostic-pattern", [response("diagnostic-pattern")]) }),
  targetSelfAssessment: Object.freeze({ completed: true, score: score("self-pattern", [response("self-pattern")]) }),
});

const emptyValidation = validateEvidenceItem({});
assert.equal(emptyValidation.valid, false);
assert.ok(emptyValidation.missing.includes("title"));
assert.ok(emptyValidation.missing.includes("storageReference"));

const worksheet = buildAnalystWorksheet(session, null, { generatedAt: "2026-05-01T00:00:00.000Z" });
assert.ok(worksheet.items.length > 0, "synthetic session must produce a finding to link evidence against");
const findingId = worksheet.items[0].findingId;

const evidenceInput = Object.freeze({
  title: "Retention package summary",
  itemType: "document",
  documentType: "retention_compensation",
  sourceParty: "target",
  storageReference: "Data room / People / retention-summary",
  reviewStatus: "verified",
  confidence: "high",
  relationship: "supports",
  analystExtract: "Retention terms identify key-person dependency and vesting risk.",
  relevantRiskCategories: ["Key-Person Retention Risk", "Talent Flight Risk"],
  relatedFindingIds: [findingId],
});

const built = buildEvidenceItem(evidenceInput, session, "2026-05-01T00:00:00.000Z");
assert.equal(built.completed, true);
assert.equal(built.item.version, undefined);
assert.equal(built.item.reviewStatus, "verified");
assert.equal(built.item.relatedFindingIds[0], findingId);

const attached = attachEvidenceItem(session, evidenceInput, "2026-05-01T00:00:00.000Z");
assert.equal(attached.ok, true);
assert.equal(evidenceItemsFromSession(attached.session).length, 1);

const coverage = buildEvidenceCoverage(attached.session);
assert.equal(coverage.version, EVIDENCE_CAPTURE_VERSION);
assert.equal(coverage.totalCount, 1);
assert.equal(coverage.verifiedCount, 1);
assert.equal(coverage.linkedFindingCount, 1);
assert.equal(coverage.verifiedRiskCategories.includes("Talent Flight Risk"), true);
assert.ok(coverage.missingCriticalRiskCategories.length > 0);

const linkedWorksheet = buildAnalystWorksheet(attached.session, null, { generatedAt: "2026-05-01T00:30:00.000Z" });
const linkedItem = linkedWorksheet.items.find((item) => item.findingId === findingId);
assert.equal(linkedItem.linkedEvidenceCount, 1);
assert.equal(linkedItem.linkedVerifiedEvidenceCount, 1);

const updated = attachEvidenceItem(attached.session, {
  ...attached.evidenceItem,
  reviewStatus: "disputed",
}, "2026-05-01T01:00:00.000Z");
assert.equal(updated.ok, true);
assert.equal(buildEvidenceCoverage(updated.session).disputedCount, 1);

const removed = removeEvidenceItem(updated.session, attached.evidenceItem.id).session;
assert.equal(evidenceItemsFromSession(removed).length, 0);
assert.equal(buildEvidenceCoverage(removed).totalCount, 0);

console.log("Evidence capture smoke test passed");
