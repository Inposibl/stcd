import { TARGET_SELF_ASSESSMENT_DATA } from "../data/targetSelfAssessmentData.js";
import { validateEvidenceClassifiedAnswers } from "./evidenceClassification.js";
import { scoreLayeredEvidenceQuestionSet } from "./layeredEvidenceScoring.js";

export const TARGET_SELF_ENVIRONMENT_CODES = Object.freeze([
  "NT/STJ",
  "NT/STP",
  "NF/NT",
  "NF/SFJ",
  "NF/SFP",
  "SFJ/SFP",
  "STJ/STP",
  "STP/STJ",
  "SFP/SFJ",
]);

export function isTargetSelfAssessmentSourceLoaded(data = TARGET_SELF_ASSESSMENT_DATA) {
  return Boolean(
    data?.targetSelfAssessment?.source === "ST_Target_Self_Assessment_Module.xlsx"
      && data?.targetSelfAssessment?.worksheet === "3_Screening"
      && data.targetSelfAssessment.questionCount >= 11
      && data.targetSelfAssessment.questions.length === data.targetSelfAssessment.questionCount
      && data.targetSelfAssessment.questions.every((question) => question.options.length >= 4),
  );
}

export function targetSelfOtherSpecifyFieldId(fieldId) {
  return `${fieldId}OtherSpecify`;
}

export function targetSelfPositioningOptionRequiresSpecify(option) {
  return /other/i.test(String(option?.text ?? "")) && /specify/i.test(String(option?.text ?? ""));
}

export function validateTargetSelfPositioning(input = {}) {
  const normalized = {};
  const missing = [];

  for (const field of TARGET_SELF_ASSESSMENT_DATA.positioningFields) {
    const value = typeof input[field.id] === "string" ? input[field.id].trim() : "";
    if (!value) {
      missing.push(field.id);
      continue;
    }
    normalized[field.id] = value;

    const selectedOption = field.options.find((option) => option.value === value);
    if (targetSelfPositioningOptionRequiresSpecify(selectedOption)) {
      const specifyFieldId = targetSelfOtherSpecifyFieldId(field.id);
      const specifiedValue = typeof input[specifyFieldId] === "string" ? input[specifyFieldId].trim() : "";
      if (!specifiedValue) {
        missing.push(specifyFieldId);
        continue;
      }
      normalized[specifyFieldId] = specifiedValue;
    }
  }

  return Object.freeze({
    valid: missing.length === 0,
    missing: Object.freeze(missing),
    normalized: Object.freeze(normalized),
  });
}

export function scoreTargetSelfAssessment(answers = {}, data = TARGET_SELF_ASSESSMENT_DATA) {
  return Object.freeze({
    ...scoreLayeredEvidenceQuestionSet(data.targetSelfAssessment.questions, answers, {
      environmentCodes: TARGET_SELF_ENVIRONMENT_CODES,
      moduleId: "target_self_assessment",
    }),
  });
}

export function buildTargetSelfAssessmentRecord(positioningInput, answers, submittedAt = new Date().toISOString()) {
  const positioning = validateTargetSelfPositioning(positioningInput);
  const score = scoreTargetSelfAssessment(answers);
  const classificationValidation = validateEvidenceClassifiedAnswers(TARGET_SELF_ASSESSMENT_DATA.targetSelfAssessment.questions, answers);
  if (!positioning.valid || !score.valid || !classificationValidation.valid) {
    return Object.freeze({
      completed: false,
      missingPositioning: positioning.missing,
      missingQuestionIds: score.missingQuestionIds,
      invalidClassification: classificationValidation.invalid,
      positioning: positioning.valid ? positioning.normalized : null,
      answers: null,
      classificationValidation,
      score,
    });
  }

  return Object.freeze({
    completed: true,
    submittedAt,
    positioning: positioning.normalized,
    answers: Object.freeze({ ...answers }),
    classificationValidation,
    score,
  });
}
