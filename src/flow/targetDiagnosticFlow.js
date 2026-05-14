import { TARGET_DIAGNOSTIC_DATA } from "../data/targetDiagnosticData.js";
import { validateEvidenceClassifiedAnswers } from "./evidenceClassification.js";
import { scoreLayeredEvidenceQuestionSet } from "./layeredEvidenceScoring.js";

export const TARGET_DIAGNOSTIC_ENVIRONMENT_CODES = Object.freeze([
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

export function isTargetDiagnosticSourceLoaded(data = TARGET_DIAGNOSTIC_DATA) {
  return Boolean(
    data?.level1?.source === "ST_Environment_Diagnostic_v2.xlsx"
      && data?.level1?.worksheet === "3_Level_1_Screening"
      && data?.level1?.questionCount === 12
      && data?.level1?.questions?.length === 12
      && data?.level2?.source === "ST_Environment_Diagnostic_v2.xlsx"
      && data?.level2?.worksheet === "4_Level_2_Deepening"
      && data?.level2?.questionCount === 10
      && data?.level2?.questions?.length === 10
      && data.level1.questions.every((question) => question.options.length >= 4)
      && data.level2.questions.every((question) => question.options.length >= 4),
  );
}

export function isStandaloneTargetDiagnosticSession(session) {
  return Boolean(
    session?.dealContext?.completed
      && session.dealContext.data?.respondentSide === "advisor",
  );
}

export function canStartTargetDiagnostic(session) {
  return Boolean(
    isTargetDiagnosticSourceLoaded()
      && (session?.targetObservation?.completed || isStandaloneTargetDiagnosticSession(session)),
  );
}

export function scoreTargetDiagnosticQuestions(questions, answers = {}) {
  return Object.freeze({
    ...scoreLayeredEvidenceQuestionSet(questions, answers, {
      environmentCodes: TARGET_DIAGNOSTIC_ENVIRONMENT_CODES,
      moduleId: "target_observed_environment_diagnostic",
    }),
  });
}

export function scoreTargetDiagnosticLevel1(answers, data = TARGET_DIAGNOSTIC_DATA) {
  const score = scoreTargetDiagnosticQuestions(data.level1.questions, answers);
  return Object.freeze({
    ...score,
    requiresLevel2: score.valid && (score.signalStrength === "weak" || score.coPresence),
  });
}

export function scoreTargetDiagnosticCombined(level1Answers, level2Answers = {}, data = TARGET_DIAGNOSTIC_DATA) {
  const combinedQuestions = [...data.level1.questions, ...data.level2.questions];
  const combinedAnswers = { ...level1Answers, ...level2Answers };
  return scoreTargetDiagnosticQuestions(combinedQuestions, combinedAnswers);
}

export function attachTargetDiagnosticLevel1(session, answers, scoredAt = new Date().toISOString()) {
  const level1Score = scoreTargetDiagnosticLevel1(answers);
  const classificationValidation = validateEvidenceClassifiedAnswers(TARGET_DIAGNOSTIC_DATA.level1.questions, answers);
  const level1Completed = level1Score.valid && classificationValidation.valid;
  const requiresLevel2 = level1Completed && level1Score.requiresLevel2;
  const target2B = Object.freeze({
    ...(session?.target2B ?? {}),
    level1: Object.freeze({
      completed: level1Completed,
      storedAt: scoredAt,
      answers: Object.freeze({ ...answers }),
      classificationValidation,
      score: level1Score,
    }),
    requiresLevel2,
    completed: level1Completed && !requiresLevel2,
    finalScore: level1Completed && !requiresLevel2 ? level1Score : null,
  });

  return Object.freeze({
    session: Object.freeze({
      ...(session ?? {}),
      target2B,
    }),
    classificationValidation,
    score: level1Score,
  });
}

export function attachTargetDiagnosticLevel2(session, answers, scoredAt = new Date().toISOString()) {
  const level1Answers = session?.target2B?.level1?.answers ?? {};
  const level2Score = scoreTargetDiagnosticQuestions(TARGET_DIAGNOSTIC_DATA.level2.questions, answers);
  const finalScore = scoreTargetDiagnosticCombined(level1Answers, answers);
  const level2ClassificationValidation = validateEvidenceClassifiedAnswers(TARGET_DIAGNOSTIC_DATA.level2.questions, answers);
  const finalClassificationValidation = validateEvidenceClassifiedAnswers(
    [...TARGET_DIAGNOSTIC_DATA.level1.questions, ...TARGET_DIAGNOSTIC_DATA.level2.questions],
    { ...level1Answers, ...answers },
  );
  const completed = finalScore.valid && level2ClassificationValidation.valid && finalClassificationValidation.valid;
  const target2B = Object.freeze({
    ...(session?.target2B ?? {}),
    level2: Object.freeze({
      completed: level2Score.valid && level2ClassificationValidation.valid,
      storedAt: scoredAt,
      answers: Object.freeze({ ...answers }),
      classificationValidation: level2ClassificationValidation,
      score: level2Score,
    }),
    completed,
    classificationValidation: finalClassificationValidation,
    finalScore,
  });

  return Object.freeze({
    session: Object.freeze({
      ...(session ?? {}),
      target2B,
    }),
    level2Score,
    finalScore,
    level2ClassificationValidation,
    finalClassificationValidation,
  });
}

export function canCreatePreliminaryAssessment(session) {
  return Boolean(
    session?.dealContext?.completed
      && session?.acquirer2A?.completed
      && session?.targetObservation?.completed
      && session?.target2B?.completed,
  );
}
