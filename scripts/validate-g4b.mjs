import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TARGET_SELF_ASSESSMENT_DATA } from "../src/data/targetSelfAssessmentData.js";
import { buildFinalDeliverable } from "../src/flow/finalDeliverableFlow.js";
import {
  buildTargetSelfAssessmentRecord,
  isTargetSelfAssessmentSourceLoaded,
  scoreTargetSelfAssessment,
  validateTargetSelfPositioning,
} from "../src/flow/targetSelfAssessmentFlow.js";
import {
  attachPreliminaryAssessment,
  canGenerateTargetInvite,
  completeTargetInvite,
  createTargetInvite,
  resetPublicAssessmentSession,
  targetInviteFromLinkParams,
  verifyTargetInvite,
} from "../src/flow/targetInviteFlow.js";
import { evidenceClassifiedAnswer } from "../src/flow/evidenceClassification.js";

function completeTrack1Session() {
  return Object.freeze({
    sessionId: "g4b-session",
    dealContext: Object.freeze({
      completed: true,
      data: Object.freeze({
        acquisitionMotive: "management_buyout",
        transactionRole: "partner_md",
        firmTenure: "more_than_3_years",
        integrationTimeline: "standard",
      }),
    }),
    acquirer2A: Object.freeze({
      completed: true,
      score: Object.freeze({ primaryEnvironmentCode: "NT/STJ" }),
    }),
    targetObservation: Object.freeze({
      completed: true,
      score: Object.freeze({ topEnvironmentCode: "NF/NT" }),
      outputContext: Object.freeze({ observationPosition: "Acquirer diligence lead" }),
    }),
    target2B: Object.freeze({
      completed: true,
      finalScore: Object.freeze({
        primaryEnvironmentCode: "NF/NT",
        signalStrength: "confirmed",
      }),
    }),
  });
}

assert.equal(isTargetSelfAssessmentSourceLoaded(), true);
assert.deepEqual(TARGET_SELF_ASSESSMENT_DATA.sources, [
  "ST_Target_Self_Assessment_Module.xlsx",
  "ST_Form_Binding_Prompt.xlsx",
]);
assert.equal(TARGET_SELF_ASSESSMENT_DATA.targetSelfAssessment.worksheet, "3_Screening");
assert.equal(TARGET_SELF_ASSESSMENT_DATA.targetSelfAssessment.questionCount, 11);
assert.equal(TARGET_SELF_ASSESSMENT_DATA.targetSelfAssessment.questions.length, 11);
assert.equal(TARGET_SELF_ASSESSMENT_DATA.targetSelfAssessment.questions.every((question) => question.options.length >= 5), true);
assert.equal(TARGET_SELF_ASSESSMENT_DATA.targetSelfAssessment.questions.every((question) => Boolean(question.directObservationGate)), true);
assert.equal(TARGET_SELF_ASSESSMENT_DATA.targetSelfAssessment.questions.every((question) => question.options.some((option) => option.value === "E")), true);

const incompleteSession = Object.freeze({ sessionId: "incomplete" });
const blockedPreliminary = attachPreliminaryAssessment(incompleteSession, "2026-05-01T00:00:00.000Z");
assert.equal(blockedPreliminary.preliminaryAssessment.completed, false);
assert.equal(canGenerateTargetInvite(blockedPreliminary.session), false);

const sessionWithPreliminary = attachPreliminaryAssessment(completeTrack1Session(), "2026-05-01T00:00:00.000Z").session;
assert.equal(sessionWithPreliminary.preliminaryAssessment.completed, true);
assert.equal(canGenerateTargetInvite(sessionWithPreliminary), true);

const inviteResult = createTargetInvite(sessionWithPreliminary, {
  createdAt: "2026-05-01T00:00:00.000Z",
  digitalCode: "123456",
  targetSessionId: "tgt-g4b",
});
assert.equal(inviteResult.ok, true);
assert.equal(inviteResult.invite.digitalCode, "123456");
assert.equal(inviteResult.invite.codeDigits, 6);
assert.equal(inviteResult.invite.ttlHours, 72);
assert.equal(inviteResult.invite.expiresAt, "2026-05-04T00:00:00.000Z");
assert.match(inviteResult.invite.surveyLink, /targetSessionId=tgt-g4b/);
assert.match(inviteResult.invite.surveyLink, /assessmentId=/);
assert.match(inviteResult.invite.surveyLink, /codeHash=/);
assert.match(inviteResult.invite.surveyLink, /expiresAt=/);

const parsedInvite = targetInviteFromLinkParams(new URL(`https://example.com${inviteResult.invite.surveyLink}`).searchParams);
assert.equal(parsedInvite.targetSessionId, "tgt-g4b");
assert.equal(parsedInvite.assessmentId, inviteResult.invite.assessmentId);
assert.equal(verifyTargetInvite(parsedInvite, "123456", "2026-05-01T01:00:00.000Z").status, "verified");
assert.equal(targetInviteFromLinkParams(new URLSearchParams("targetSessionId=tgt-missing")), null);

assert.equal(verifyTargetInvite(inviteResult.invite, "000000", "2026-05-01T01:00:00.000Z").status, "wrong-code");
assert.equal(verifyTargetInvite(inviteResult.invite, "123456", "2026-05-04T00:00:01.000Z").status, "expired");
assert.equal(verifyTargetInvite(inviteResult.invite, "123456", "2026-05-01T01:00:00.000Z").status, "verified");

const positioning = { p1: "A", p2: "C" };
const answers = Object.fromEntries(
  TARGET_SELF_ASSESSMENT_DATA.targetSelfAssessment.questions.map((question) => [question.id, evidenceClassifiedAnswer("A")]),
);
const targetScore = scoreTargetSelfAssessment(answers);
assert.equal(targetScore.valid, true);
assert.equal(targetScore.answeredQuestionCount, 11);
assert.equal(targetScore.scoringModelVersion, "newlogic-layered-evidence-v1");
assert.equal(targetScore.outputKind, "weighted_signal_pattern");
assert.equal(targetScore.requiresAnalystReview, true);
assert.equal(targetScore.legacyAdditiveScoring, false);
assert.equal(targetScore.confidence, "high");
assert.equal(targetScore.evidenceQuality.legacyOptionOnlyCount, 0);
assert.equal(targetScore.evidenceQuality.directObservationCount, 11);

const targetSelfAssessment = buildTargetSelfAssessmentRecord(positioning, answers, "2026-05-01T01:30:00.000Z");
assert.equal(targetSelfAssessment.completed, true);
assert.equal(targetSelfAssessment.classificationValidation.valid, true);
const completedInvite = completeTargetInvite(inviteResult.invite, targetSelfAssessment, "2026-05-01T01:31:00.000Z").invite;
assert.equal(completedInvite.completed, true);
assert.equal(verifyTargetInvite(completedInvite, "123456", "2026-05-01T01:32:00.000Z").status, "completed");

const directFinalDeliverable = buildFinalDeliverable(Object.freeze({
  ...sessionWithPreliminary,
  targetSelfAssessment,
  targetSelfDirect: Object.freeze({
    completed: true,
    route: "step-2c-direct",
    completedAt: targetSelfAssessment.submittedAt,
  }),
}));
assert.equal(directFinalDeliverable.ready, true);

const invitedFinalDeliverable = buildFinalDeliverable(Object.freeze({
  ...inviteResult.session,
  targetInvite: completedInvite,
  targetSelfAssessment,
}));
assert.equal(invitedFinalDeliverable.ready, true);

const missingTargetSelfFinalDeliverable = buildFinalDeliverable(sessionWithPreliminary);
assert.equal(missingTargetSelfFinalDeliverable.ready, false);
assert.equal(missingTargetSelfFinalDeliverable.status, "target-self-assessment-required");

const incompleteTargetSelfFinalDeliverable = buildFinalDeliverable(Object.freeze({
  ...sessionWithPreliminary,
  targetInvite: Object.freeze({ completed: true }),
  targetSelfAssessment: Object.freeze({ completed: false }),
}));
assert.equal(incompleteTargetSelfFinalDeliverable.ready, false);
assert.equal(incompleteTargetSelfFinalDeliverable.status, "target-self-assessment-required");

const directMarkerOnlyFinalDeliverable = buildFinalDeliverable(Object.freeze({
  ...sessionWithPreliminary,
  targetSelfDirect: Object.freeze({ completed: true }),
}));
assert.equal(directMarkerOnlyFinalDeliverable.ready, false);
assert.equal(directMarkerOnlyFinalDeliverable.status, "target-self-assessment-required");

const inviteMarkerOnlyFinalDeliverable = buildFinalDeliverable(Object.freeze({
  ...sessionWithPreliminary,
  targetInvite: Object.freeze({ completed: true }),
}));
assert.equal(inviteMarkerOnlyFinalDeliverable.ready, false);
assert.equal(inviteMarkerOnlyFinalDeliverable.status, "target-self-assessment-required");

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
assert.match(appSource, /function TargetReceiptScreen\(\{ invited = false, session = null \}\)[\s\S]*const finalDeliverable = buildFinalDeliverable\(session\);[\s\S]*Go to final report page[\s\S]*navigate\(finalDeliverable\.route\)/);

const otherPositioningMissingText = validateTargetSelfPositioning({ p1: "D", p2: "C" });
assert.equal(otherPositioningMissingText.valid, false);
assert.deepEqual(otherPositioningMissingText.missing, ["p1OtherSpecify"]);
const otherPositioning = validateTargetSelfPositioning({ p1: "D", p1OtherSpecify: "Operating partner", p2: "C" });
assert.equal(otherPositioning.valid, true);
assert.equal(otherPositioning.normalized.p1OtherSpecify, "Operating partner");

const resetSession = resetPublicAssessmentSession(inviteResult.session, "2026-05-01T02:00:00.000Z");
assert.equal(resetSession.invalidatedInvite.revoked, true);
assert.equal(verifyTargetInvite(resetSession.invalidatedInvite, "123456", "2026-05-01T02:01:00.000Z").status, "revoked");
assert.notEqual(resetSession.sessionId, inviteResult.session.sessionId);

console.log("G-4b target link/code isolation smoke test passed");
