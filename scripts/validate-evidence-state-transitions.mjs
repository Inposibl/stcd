import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  updateEvidenceAnswer,
  validateEvidenceClassifiedAnswer,
} from "../src/flow/evidenceClassification.js";

function assertValid(answer, message) {
  assert.equal(validateEvidenceClassifiedAnswer(answer).valid, true, message);
}

const indirectDocumentAnswer = updateEvidenceAnswer({ selectedOption: "A" }, {
  directObservationGate: "no",
  evidenceType: "document_supported",
  knowledgeLevel: "document_based",
  confidence: "high",
  reliabilityFlags: [],
  reliabilityFlagsAcknowledged: true,
});
assertValid(indirectDocumentAnswer, "No - indirect basis must allow document-supported evidence");

let noIndirectFirst = updateEvidenceAnswer(undefined, { selectedOption: "A" });
noIndirectFirst = updateEvidenceAnswer(noIndirectFirst, { directObservationGate: "no" });
const incompleteNoIndirectFirst = validateEvidenceClassifiedAnswer(noIndirectFirst);
assert.equal(incompleteNoIndirectFirst.valid, false);
assert.equal(incompleteNoIndirectFirst.missing.includes("evidence type"), true);
noIndirectFirst = updateEvidenceAnswer(noIndirectFirst, {
  evidenceType: "document_supported",
  knowledgeLevel: "document_based",
  confidence: "high",
  reliabilityFlags: [],
  reliabilityFlagsAcknowledged: true,
});
assertValid(noIndirectFirst, "Selecting No - indirect basis before other fields should not permanently block Next");

const cannotAnswer = updateEvidenceAnswer(undefined, { selectedOption: "E" });
assert.equal(cannotAnswer.directObservationGate, "no");
assert.equal(cannotAnswer.evidenceType, "unknown");
assert.equal(cannotAnswer.knowledgeLevel, "not_known");
assert.equal(cannotAnswer.confidence, "cannot_determine");
assert.equal(cannotAnswer.reliabilityFlags.includes("no_direct_knowledge"), true);
assertValid(cannotAnswer, "Option E should auto-complete the unknown evidence classification");

const switchedBack = updateEvidenceAnswer(cannotAnswer, { selectedOption: "A" });
assert.equal(switchedBack.selectedOption, "A");
assert.equal(switchedBack.directObservationGate, "");
assert.equal(switchedBack.evidenceType, "");
assert.equal(switchedBack.knowledgeLevel, "");
assert.equal(switchedBack.confidence, "");
assert.equal(switchedBack.reliabilityFlags.includes("no_direct_knowledge"), false);
const switchedBackValidation = validateEvidenceClassifiedAnswer(switchedBack);
assert.equal(switchedBackValidation.valid, false);
assert.equal(switchedBackValidation.missing.includes("evidence type"), true);

const completedAfterSwitch = updateEvidenceAnswer(switchedBack, {
  directObservationGate: "yes",
  evidenceType: "direct_observation",
  knowledgeLevel: "first_hand",
  confidence: "high",
  reliabilityFlags: [],
  reliabilityFlagsAcknowledged: true,
});
assertValid(completedAfterSwitch, "A/B/C/D answers should become valid again after evidence fields are completed");

const unknownEvidence = updateEvidenceAnswer({ selectedOption: "A" }, { evidenceType: "unknown" });
assert.equal(unknownEvidence.directObservationGate, "no");
assert.equal(unknownEvidence.knowledgeLevel, "not_known");
assert.equal(unknownEvidence.confidence, "cannot_determine");
assert.equal(unknownEvidence.reliabilityFlags.includes("no_direct_knowledge"), true);

const evidenceRestored = updateEvidenceAnswer(unknownEvidence, { evidenceType: "direct_observation" });
assert.equal(evidenceRestored.selectedOption, "A");
assert.equal(evidenceRestored.evidenceType, "direct_observation");
assert.equal(evidenceRestored.directObservationGate, "");
assert.equal(evidenceRestored.knowledgeLevel, "");
assert.equal(evidenceRestored.confidence, "");
assert.equal(evidenceRestored.reliabilityFlags.includes("no_direct_knowledge"), false);
assert.equal(validateEvidenceClassifiedAnswer(evidenceRestored).valid, false);

const completedAfterUnknownEvidence = updateEvidenceAnswer(evidenceRestored, {
  directObservationGate: "yes",
  knowledgeLevel: "first_hand",
  confidence: "high",
  reliabilityFlags: [],
  reliabilityFlagsAcknowledged: true,
});
assertValid(completedAfterUnknownEvidence, "Evidence type Unknown should be reversible when changed back to a known evidence type");

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

assert.equal(appSource.includes('flight: "Flight'), false, "ECS table must not render bare Flight labels");
assert.equal((appSource.match(/Talent flight risk:/g) ?? []).length, 5, "ECS table should clarify Talent flight risk in every band");

const directSelectedOptionUpdates = appSource.match(
  /updateEvidenceAnswer\(current\[question\.id\],\s*\{\s*selectedOption:\s*value\s*\}\s*\)/g,
) ?? [];
assert.equal(
  directSelectedOptionUpdates.length,
  0,
  "Questionnaire option handlers should use the shared selected-answer helper",
);

const sharedHelperCalls = appSource.match(
  /updateQuestionnaireSelectedAnswer\(current,\s*question,\s*value\)/g,
) ?? [];
assert.equal(sharedHelperCalls.length, 7, "All questionnaire option handlers should use the shared helper");

const blockingMessages = appSource.match(
  /<QuestionnaireBlockingMessage\s+validation=\{currentAnswerValidation\}\s*\/>/g,
) ?? [];
assert.equal(blockingMessages.length, 7, "All questionnaire screens should explain disabled Next/Submit state");
assert.equal(stylesSource.includes(".question-blocking-message"), true, "Disabled Next/Submit explanation should be styled");

for (const requiredText of [
  "Authorized Target Observer response received.",
  "The original assessment tab will unlock the next step automatically if it is still open.",
  "If the original tab does not change, the sender can return to Target Observation Setup",
  "The original assessment tab will update automatically if it is still open.",
  "The original assessment tab has been updated with the target respondent's self-description.",
]) {
  assert.equal(appSource.includes(requiredText), true, `Missing linked-response status copy: ${requiredText}`);
}

console.log("Critic regression validation passed");
