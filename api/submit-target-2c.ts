import { buildTargetSelfAssessmentRecord } from "../src/flow/targetSelfAssessmentFlow.js";
import { completeServerTargetSession } from "./_sessionLedger.js";
import { methodNotAllowed, parseJsonBody, jsonResponse } from "./_response.js";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return methodNotAllowed(request.method, ["POST"]);
  }

  const body = await parseJsonBody(request);
  const targetSessionId = typeof body?.targetSessionId === "string" ? body.targetSessionId : "";
  const digitalCode = typeof body?.digitalCode === "string" ? body.digitalCode : "";
  const positioning = typeof body?.positioning === "object" && body.positioning ? body.positioning : {};
  const answers = typeof body?.answers === "object" && body.answers ? body.answers : {};
  const targetSelfAssessment = buildTargetSelfAssessmentRecord(positioning, answers);

  if (!targetSelfAssessment.completed) {
    return jsonResponse(400, {
      endpoint: "/api/submit-target-2c",
      status: "target-self-assessment-incomplete",
      missingPositioning: targetSelfAssessment.missingPositioning,
      missingQuestionIds: targetSelfAssessment.missingQuestionIds,
    });
  }

  const result = completeServerTargetSession(targetSessionId, digitalCode, targetSelfAssessment);
  return jsonResponse(result.ok ? 200 : 403, {
    endpoint: "/api/submit-target-2c",
    ...result,
    receipt: {
      title: "Your responses have been received.",
      body: "Thank you for the time spent on this survey.",
      close: "You can close this page.",
    },
  });
}
