import assert from "node:assert/strict";
import { TARGET_DIAGNOSTIC_DATA } from "../src/data/targetDiagnosticData.js";
import {
  attachTargetDiagnosticLevel1,
  attachTargetDiagnosticLevel2,
  canCreatePreliminaryAssessment,
  canStartTargetDiagnostic,
  isStandaloneTargetDiagnosticSession,
  isTargetDiagnosticSourceLoaded,
  scoreTargetDiagnosticLevel1,
} from "../src/flow/targetDiagnosticFlow.js";
import { evidenceClassifiedAnswer } from "../src/flow/evidenceClassification.js";
import { SCREEN_REGISTRY } from "../src/screenRegistry.js";

function routeIndex(route) {
  return SCREEN_REGISTRY.findIndex((screen) => screen.route === route);
}

function answersForCode(questions, code) {
  return Object.fromEntries(
    questions.map((question) => [
      question.id,
      evidenceClassifiedAnswer((question.options.find((option) => option.signals.includes(code)) ?? question.options[0]).value),
    ]),
  );
}

function lowConfidenceAnswers(questions, value) {
  return Object.fromEntries(
    questions.map((question) => [question.id, evidenceClassifiedAnswer(value, {
      directObservationGate: "no",
      evidenceType: "inference",
      knowledgeLevel: "pattern_based",
      confidence: "low",
      reliabilityFlags: ["no_direct_knowledge"],
      reliabilityFlagsAcknowledged: true,
    })]),
  );
}

assert.deepEqual(TARGET_DIAGNOSTIC_DATA.sources, [
  "ST_Environment_Diagnostic_v2.xlsx",
  "ST_Form_Binding_Prompt.xlsx",
]);
assert.equal(TARGET_DIAGNOSTIC_DATA.level1.questionCount, 12);
assert.equal(TARGET_DIAGNOSTIC_DATA.level1.questions.length, 12);
assert.equal(TARGET_DIAGNOSTIC_DATA.level2.questionCount, 10);
assert.equal(TARGET_DIAGNOSTIC_DATA.level2.questions.length, 10);
assert.equal(TARGET_DIAGNOSTIC_DATA.level1.worksheet, "3_Level_1_Screening");
assert.equal(TARGET_DIAGNOSTIC_DATA.level2.worksheet, "4_Level_2_Deepening");
assert.equal(TARGET_DIAGNOSTIC_DATA.level1.questions.every((question) => question.options.length >= 5), true);
assert.equal(TARGET_DIAGNOSTIC_DATA.level2.questions.every((question) => question.options.length === 5), true);
assert.equal(TARGET_DIAGNOSTIC_DATA.level1.questions.every((question) => Boolean(question.directObservationGate)), true);
assert.equal(TARGET_DIAGNOSTIC_DATA.level2.questions.every((question) => Boolean(question.directObservationGate)), true);
assert.equal(TARGET_DIAGNOSTIC_DATA.level1.questions.every((question) => question.options.some((option) => option.value === "E")), true);
assert.equal(TARGET_DIAGNOSTIC_DATA.level2.questions.every((question) => question.options.some((option) => option.value === "E")), true);
assert.equal(isTargetDiagnosticSourceLoaded(), true);

const expectedOrder = [
  "/screen-6b-target-observation",
  "/screen-7-step-2b-level-1",
  "/screen-8-step-2b-transition",
  "/screen-9-step-2b-level-2",
  "/screen-9a-target-code-gate",
];
for (let index = 1; index < expectedOrder.length; index += 1) {
  assert.ok(routeIndex(expectedOrder[index - 1]) < routeIndex(expectedOrder[index]), `${expectedOrder[index - 1]} must precede ${expectedOrder[index]}`);
}

const baseSession = Object.freeze({
  sessionId: "step2b-smoke",
  dealContext: Object.freeze({ completed: true }),
  acquirer2A: Object.freeze({ completed: true }),
  targetObservation: Object.freeze({ completed: true }),
});
assert.equal(canStartTargetDiagnostic({ sessionId: "blocked" }), false);
assert.equal(canStartTargetDiagnostic(baseSession), true);
const advisorSession = Object.freeze({
  sessionId: "step2b-advisor",
  dealContext: Object.freeze({
    completed: true,
    data: Object.freeze({ respondentSide: "advisor" }),
  }),
});
assert.equal(isStandaloneTargetDiagnosticSession(advisorSession), true);
assert.equal(canStartTargetDiagnostic(advisorSession), true);

const incomplete = scoreTargetDiagnosticLevel1({});
assert.equal(incomplete.valid, false);
assert.equal(incomplete.missingQuestionIds.length, 12);

const strongLevel1Answers = answersForCode(TARGET_DIAGNOSTIC_DATA.level1.questions, "NT/STJ");
const strongLevel1Score = scoreTargetDiagnosticLevel1(strongLevel1Answers);
assert.equal(strongLevel1Score.valid, true);
assert.equal(strongLevel1Score.scoringModelVersion, "newlogic-layered-evidence-v1");
assert.equal(strongLevel1Score.outputKind, "weighted_signal_pattern");
assert.equal(strongLevel1Score.requiresAnalystReview, true);
assert.equal(strongLevel1Score.legacyAdditiveScoring, false);
assert.equal(strongLevel1Score.confidence, "high");
assert.equal(strongLevel1Score.evidenceQuality.legacyOptionOnlyCount, 0);
assert.equal(strongLevel1Score.evidenceQuality.directObservationCount, 12);
assert.equal(strongLevel1Score.primaryEnvironmentCode, "NT/STJ");

const strongSession = attachTargetDiagnosticLevel1(baseSession, strongLevel1Answers).session;
assert.equal(strongSession.target2B.level1.classificationValidation.valid, true);

const weakLevel1Answers = lowConfidenceAnswers(TARGET_DIAGNOSTIC_DATA.level1.questions, "A");
const weakLevel1Score = scoreTargetDiagnosticLevel1(weakLevel1Answers);
assert.equal(weakLevel1Score.valid, true);
assert.equal(weakLevel1Score.requiresLevel2, true);

const weakSession = attachTargetDiagnosticLevel1(baseSession, weakLevel1Answers).session;
assert.equal(weakSession.target2B.completed, false);
assert.equal(canCreatePreliminaryAssessment(weakSession), false);

const level2Answers = Object.fromEntries(
  TARGET_DIAGNOSTIC_DATA.level2.questions.map((question) => [question.id, evidenceClassifiedAnswer("A")]),
);
const completedSession = attachTargetDiagnosticLevel2(weakSession, level2Answers).session;
assert.equal(completedSession.target2B.completed, true);
assert.equal(completedSession.target2B.classificationValidation.valid, true);
assert.equal(completedSession.target2B.finalScore.valid, true);
assert.equal(completedSession.target2B.finalScore.outputKind, "weighted_signal_pattern");
assert.equal(completedSession.target2B.finalScore.requiresAnalystReview, true);
assert.equal(canCreatePreliminaryAssessment(completedSession), true);

console.log("Step 2-B target diagnostic layered-evidence routing smoke test passed");
