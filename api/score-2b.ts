import {
  scoreTargetDiagnosticCombined,
  scoreTargetDiagnosticLevel1,
  scoreTargetDiagnosticQuestions,
} from "../src/flow/targetDiagnosticFlow.js";
import { TARGET_DIAGNOSTIC_DATA } from "../src/data/targetDiagnosticData.js";
import { methodNotAllowed, parseJsonBody, jsonResponse } from "./_response.js";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return methodNotAllowed(request.method, ["POST"]);
  }

  const body = await parseJsonBody(request);
  const level1Answers = typeof body?.level1Answers === "object" && body.level1Answers ? body.level1Answers : {};
  const level2Answers = typeof body?.level2Answers === "object" && body.level2Answers ? body.level2Answers : {};
  const level1Score = scoreTargetDiagnosticLevel1(level1Answers);

  if (!level1Score.valid) {
    return jsonResponse(400, {
      endpoint: "/api/score-2b",
      status: "level-1-incomplete",
      missingQuestionIds: level1Score.missingQuestionIds,
    });
  }

  if (!level1Score.requiresLevel2) {
    return jsonResponse(200, {
      endpoint: "/api/score-2b",
      status: "level-1-final",
      requiresLevel2: false,
      finalScore: level1Score,
    });
  }

  const level2Score = scoreTargetDiagnosticQuestions([...TARGET_DIAGNOSTIC_DATA.level2.questions], level2Answers);
  if (!level2Score.valid) {
    return jsonResponse(400, {
      endpoint: "/api/score-2b",
      status: "level-2-required",
      requiresLevel2: true,
      level1Score,
      missingQuestionIds: level2Score.missingQuestionIds,
    });
  }

  return jsonResponse(200, {
    endpoint: "/api/score-2b",
    status: "combined-final",
    requiresLevel2: true,
    level1Score,
    level2Score,
    finalScore: scoreTargetDiagnosticCombined(level1Answers, level2Answers),
  });
}
