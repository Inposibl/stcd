import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACQUIRER_TRACK_DATA } from "../src/data/acquirerTrackData.js";
import { TARGET_DIAGNOSTIC_DATA } from "../src/data/targetDiagnosticData.js";
import { TARGET_OBSERVATION_DIAGNOSTIC } from "../src/data/targetObservedEnvironmentDiagnostic.js";
import { TARGET_SELF_ASSESSMENT_DATA } from "../src/data/targetSelfAssessmentData.js";

const questionnaires = JSON.parse(readFileSync(new URL("../src/generated/newlogic/questionnaires.json", import.meta.url), "utf8"));
const formBindings = JSON.parse(readFileSync(new URL("../src/generated/newlogic/formBindings.json", import.meta.url), "utf8"));

const STEP_TOD_DIRECT_OBSERVATION_GATE_TEXT = "Direct Observation Gate (v3.1) — Did your diligence team produce direct, observable evidence on this dimension?";

function normalize(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function generatedModule(id) {
  const module = questionnaires.modules.find((item) => item.id === id);
  assert.ok(module, `Generated questionnaire module missing: ${id}`);
  return module;
}

function generatedQuestionId(question) {
  return question.workbookQuestionId ?? question.id;
}

function compareRuntimeModule(label, runtimeQuestions, generatedQuestions) {
  assert.equal(runtimeQuestions.length, generatedQuestions.length, `${label}: runtime question count drift`);

  const runtimeById = new Map(runtimeQuestions.map((question) => [question.id, question]));
  for (const generatedQuestion of generatedQuestions) {
    const questionId = generatedQuestionId(generatedQuestion);
    const runtimeQuestion = runtimeById.get(questionId);
    assert.ok(runtimeQuestion, `${label}: missing runtime question ${questionId}`);
    assert.equal(normalize(runtimeQuestion.text), normalize(generatedQuestion.prompt), `${label}: prompt drift on ${questionId}`);
    assert.equal(runtimeQuestion.options.length, generatedQuestion.options.length, `${label}: option count drift on ${questionId}`);

    for (const generatedOption of generatedQuestion.options) {
      const runtimeOption = runtimeQuestion.options.find((option) => option.value === generatedOption.value);
      assert.ok(runtimeOption, `${label}: missing option ${questionId}-${generatedOption.value}`);
      assert.equal(
        normalize(runtimeOption.text),
        normalize(generatedOption.text),
        `${label}: option text drift on ${questionId}-${generatedOption.value}`,
      );
    }
  }
}

function bindingQuestions(bindingKey) {
  return new Set((formBindings.bindings[bindingKey] ?? []).map((row) => row.q).filter(Boolean));
}

function bindingGateCount(bindingKey) {
  return (formBindings.bindings[bindingKey] ?? []).filter((row) => row.opt === "Gate").length;
}

function assertStepTodDirectObservationGates() {
  const generatedTedQuestions = generatedModule("targetObservedEnvironment").questions
    .filter((question) => generatedQuestionId(question).startsWith("TED "));
  assert.equal(generatedTedQuestions.length, 19, "STEP-TOD TED question count drift");

  for (const question of generatedTedQuestions) {
    const questionId = generatedQuestionId(question);
    assert.equal(
      normalize(question.directObservationGate),
      STEP_TOD_DIRECT_OBSERVATION_GATE_TEXT,
      `STEP-TOD: direct observation gate drift on ${questionId}`,
    );
  }

  const runtimeTedQuestions = TARGET_OBSERVATION_DIAGNOSTIC.questions
    .filter((question) => question.id.startsWith("TED "));
  assert.equal(runtimeTedQuestions.length, 19, "STEP-TOD runtime TED question count drift");

  for (const question of runtimeTedQuestions) {
    assert.equal(
      normalize(question.directObservationGate?.prompt),
      STEP_TOD_DIRECT_OBSERVATION_GATE_TEXT,
      `STEP-TOD: runtime direct observation gate drift on ${question.id}`,
    );
  }
}

compareRuntimeModule(
  "STEP-2A",
  ACQUIRER_TRACK_DATA.acquirerModule.questions,
  generatedModule("acquirerEnvironment").questions,
);
compareRuntimeModule(
  "STEP-2C",
  TARGET_SELF_ASSESSMENT_DATA.targetSelfAssessment.questions,
  generatedModule("targetSelfAssessment").questions,
);
compareRuntimeModule(
  "STEP-2B-L1",
  TARGET_DIAGNOSTIC_DATA.level1.questions,
  generatedModule("environmentLevel1").questions,
);
compareRuntimeModule(
  "STEP-2B-L2",
  TARGET_DIAGNOSTIC_DATA.level2.questions,
  generatedModule("environmentLevel2").questions,
);
compareRuntimeModule(
  "STEP-TOD",
  TARGET_OBSERVATION_DIAGNOSTIC.questions,
  generatedModule("targetObservedEnvironment").questions,
);
assertStepTodDirectObservationGates();

assert.equal(bindingQuestions("step2A").size, 11, "STEP-2A binding question count drift");
assert.equal(bindingQuestions("step2C").size, 11, "STEP-2C binding question count drift");
assert.equal(bindingQuestions("step2BLevel1").size, 12, "STEP-2B-L1 binding question count drift");
assert.equal(bindingQuestions("step2BLevel2").size, 10, "STEP-2B-L2 binding question count drift");
assert.equal(bindingQuestions("stepTargetObserved").size, 23, "STEP-TOD binding question count drift");
assert.equal(bindingGateCount("step2A"), 11, "STEP-2A gate binding count drift");
assert.equal(bindingGateCount("step2C"), 11, "STEP-2C gate binding count drift");
assert.equal(bindingGateCount("step2BLevel1"), 12, "STEP-2B-L1 gate binding count drift");
assert.equal(bindingGateCount("step2BLevel2"), 10, "STEP-2B-L2 gate binding count drift");
assert.equal(bindingGateCount("stepTargetObserved"), 19, "STEP-TOD gate binding count drift");

console.log("Questionnaire binding integrity test passed");
