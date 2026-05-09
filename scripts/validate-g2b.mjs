import assert from "node:assert/strict";
import { TARGET_OBSERVATION_DIAGNOSTIC } from "../src/data/targetObservedEnvironmentDiagnostic.js";
import {
  RESPONDENT_CONTEXT_SECTIONS,
  TARGET_OBSERVATION_SETUP_FIELDS,
  attachAuthorizedObservationCompletion,
  attachTargetObservationSetup,
  canStartTargetObservation,
  completeObservationSetupInvite,
  createObservationSetupInvite,
  createTargetObservationOutputContext,
  observationSetupInviteFromLinkParams,
  isTargetObservationSourceLoaded,
  scoreTargetObservation,
  validateTargetObservationSetup,
  verifyObservationSetupInvite,
} from "../src/flow/targetObservationFlow.js";
import { evidenceClassifiedAnswer } from "../src/flow/evidenceClassification.js";
import { SCREEN_REGISTRY } from "../src/screenRegistry.js";

function routeIndex(route) {
  return SCREEN_REGISTRY.findIndex((screen) => screen.route === route);
}

assert.equal(TARGET_OBSERVATION_DIAGNOSTIC.source, "ST_Target_Observed_Environment_Diagnostic.xlsx");
assert.equal(TARGET_OBSERVATION_DIAGNOSTIC.worksheet, "Questionnaire");
assert.equal(TARGET_OBSERVATION_DIAGNOSTIC.questionCount, 23);
assert.equal(TARGET_OBSERVATION_DIAGNOSTIC.questions.length, 23);
assert.equal(TARGET_OBSERVATION_DIAGNOSTIC.questions.at(-1).id, "TED Q19");
assert.equal(TARGET_OBSERVATION_DIAGNOSTIC.questions.filter((question) => question.id.startsWith("TED ")).every((question) => Boolean(question.directObservationGate)), true);
assert.equal(TARGET_OBSERVATION_DIAGNOSTIC.questions.filter((question) => question.id.startsWith("TED ")).every((question) => question.options.some((option) => option.value === "E")), true);
assert.equal(isTargetObservationSourceLoaded(), true, "Target Observation source workbook data must be loaded");
assert.equal(TARGET_OBSERVATION_SETUP_FIELDS.length, 3);
assert.equal(TARGET_OBSERVATION_SETUP_FIELDS[1].type, "structured-context");
assert.deepEqual(TARGET_OBSERVATION_SETUP_FIELDS.find((field) => field.id === "integrationTimeline").options, [
  "Pre-signing diligence",
  "Signing to close",
  "First 30 days after close",
]);
assert.deepEqual(RESPONDENT_CONTEXT_SECTIONS.map((section) => section.id), [
  "targetExposureDuration",
  "targetAccessLevel",
  "observedActorLevel",
  "observationEvidenceBasis",
]);

const setupRoute = routeIndex("/screen-6a-target-observation-setup");
const setupDetailsRoute = routeIndex("/screen-6a-target-observation-setup/details");
const authorizedSetupRoute = routeIndex("/screen-6a-target-observation-setup/authorized");
const observationRoute = routeIndex("/screen-6b-target-observation");
const step2bRoute = routeIndex("/screen-7-step-2b-level-1");
assert.ok(setupRoute > -1, "Target Observation Setup route missing");
assert.ok(setupDetailsRoute > -1, "Target Observation Setup details route missing");
assert.ok(authorizedSetupRoute > -1, "Authorized Target Observation Setup route missing");
assert.ok(observationRoute > -1, "Target Observation route missing");
assert.ok(step2bRoute > -1, "Step 2-B route missing");
assert.ok(setupRoute < setupDetailsRoute, "Setup intro must render before setup details");
assert.ok(setupDetailsRoute < observationRoute, "Setup details must render before Target Observation");
assert.ok(observationRoute < step2bRoute, "Target Observation must render before Step 2-B");

const emptySession = Object.freeze({ sessionId: "g2b-smoke", targetObservationSetup: null });
assert.equal(canStartTargetObservation(emptySession), false, "Target Observation must be blocked before setup");

const incompleteSetup = validateTargetObservationSetup({
  observationPosition: "Acquirer diligence lead",
  integrationTimeline: "Pre-signing diligence",
});
assert.equal(incompleteSetup.valid, false, "Incomplete setup must fail validation");
assert.deepEqual(incompleteSetup.missing, [
  "targetExposureDuration",
  "targetAccessLevel",
  "observedActorLevel",
  "observationEvidenceBasis",
]);

const completeSetup = {
  observationPosition: "Acquirer diligence lead",
  targetExposureDuration: "2_to_6_months",
  targetAccessLevel: "site_or_team_sessions",
  observedActorLevel: "senior_leadership",
  observationEvidenceBasis: "repeated_workshops",
  integrationTimeline: "Pre-signing diligence",
};
const attached = attachTargetObservationSetup(emptySession, completeSetup, "2026-05-01T00:00:00.000Z");
assert.equal(attached.setup.completed, true, "Complete setup must be stored");
assert.equal(canStartTargetObservation(attached.session), true, "Target Observation must start after setup");
assert.equal(attached.session.targetObservationSetup.data.observationPosition, completeSetup.observationPosition);
assert.equal(attached.session.targetObservationSetup.data.respondentContextProfile.targetAccessLevel, "site_or_team_sessions");
assert.equal(attached.session.targetObservationSetup.data.respondentContext.includes("Site visits or team sessions"), true);

const inviteResult = createObservationSetupInvite(Object.freeze({ sessionId: "g2b-smoke" }), {
  createdAt: "2026-05-01T00:00:00.000Z",
  digitalCode: "123456",
  observationSessionId: "obs-g2b",
});
assert.equal(inviteResult.ok, true);
assert.equal(inviteResult.invite.ttlHours, 72);
assert.match(inviteResult.invite.surveyLink, /observationSessionId=obs-g2b/);
assert.match(inviteResult.invite.surveyLink, /codeHash=/);
const parsedInvite = observationSetupInviteFromLinkParams(new URL(`https://example.com${inviteResult.invite.surveyLink}`).searchParams);
assert.equal(parsedInvite.observationSessionId, "obs-g2b");
assert.equal(verifyObservationSetupInvite(parsedInvite, "123456", "2026-05-01T01:00:00.000Z").status, "verified");
assert.equal(verifyObservationSetupInvite(parsedInvite, "000000", "2026-05-01T01:00:00.000Z").status, "wrong-code");

const allAAnswers = Object.fromEntries(
  TARGET_OBSERVATION_DIAGNOSTIC.questions.map((question) => [question.id, evidenceClassifiedAnswer("A")]),
);
const score = scoreTargetObservation(allAAnswers);
const expectedEvidenceConfidence = TARGET_OBSERVATION_DIAGNOSTIC.questions.reduce((total, question) => {
  const option = question.options.find((item) => item.value === "A");
  const match = option?.confidenceImpact?.match(/\+(\d+)/);
  return total + (match ? Number(match[1]) : 0);
}, 0);
assert.equal(score.valid, true, "Complete Target Observation answers must score");
assert.equal(score.answeredQuestionCount, 23);
assert.equal(score.diagnosticAnswerCount, 19);
assert.equal(score.evidenceConfidence, expectedEvidenceConfidence);
assert.equal(score.scoringModelVersion, "newlogic-layered-evidence-v1");
assert.equal(score.outputKind, "weighted_signal_pattern");
assert.equal(score.requiresAnalystReview, true);
assert.equal(score.legacyAdditiveScoring, false);
assert.equal(score.confidence, "high");
assert.equal(score.classificationValidation.valid, true);
assert.equal(score.evidenceQuality.legacyOptionOnlyCount, 0);
assert.equal(score.evidenceQuality.directObservationCount, 23);
assert.ok(score.topEnvironmentCode, "Observed target environment must be produced");

const outputContext = createTargetObservationOutputContext(attached.session, score);
assert.equal(outputContext.observationPosition, completeSetup.observationPosition);
assert.equal(outputContext.respondentContext, attached.session.targetObservationSetup.data.respondentContext);
assert.equal(outputContext.respondentContextProfile.observationEvidenceBasis, "repeated_workshops");
assert.equal(outputContext.integrationTimeline, completeSetup.integrationTimeline);
assert.equal(outputContext.observedTargetEnvironment, score.topEnvironmentCode);

const completedObservation = Object.freeze({
  completed: true,
  storedAt: "2026-05-01T01:30:00.000Z",
  answers: Object.freeze({ ...allAAnswers }),
  classificationValidation: score.classificationValidation,
  score,
  outputContext,
});
const completedInvite = completeObservationSetupInvite(
  inviteResult.invite,
  attached.setup,
  completedObservation,
  "2026-05-01T01:30:00.000Z",
).invite;
const completedTarget2B = Object.freeze({
  completed: true,
  finalScore: Object.freeze({ primaryEnvironmentCode: score.topEnvironmentCode, signalStrength: "confirmed" }),
});
const completedObserverInvite = Object.freeze({ ...completedInvite, target2B: completedTarget2B });
const authorizedSession = attachAuthorizedObservationCompletion(inviteResult.session, completedObserverInvite);
assert.equal(authorizedSession.targetObservationSetupInvite.completed, true, "Authorized completion must mark invite complete");
assert.equal(authorizedSession.targetObservation.completed, true, "Authorized completion must attach Target Observation answers");
assert.equal(authorizedSession.targetObservationSetup.completed, true, "Authorized completion must attach Target Observation setup");
assert.equal(authorizedSession.target2B.completed, true, "Authorized completion must attach Target Diagnostic answers");
const mismatchedInvite = Object.freeze({ ...completedObserverInvite, observationSessionId: "obs-other" });
assert.equal(
  attachAuthorizedObservationCompletion(inviteResult.session, mismatchedInvite),
  inviteResult.session,
  "Mismatched authorized completion must not unlock the current invite",
);

console.log("G-2b Target Observation setup gate smoke test passed");
