import { createServerTargetSession } from "./_sessionLedger.js";
import { methodNotAllowed, parseJsonBody, jsonResponse } from "./_response.js";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return methodNotAllowed(request.method, ["POST"]);
  }

  const body = await parseJsonBody(request);
  const result = createServerTargetSession({
    assessmentSessionId: typeof body?.assessmentSessionId === "string" ? body.assessmentSessionId : "",
    preliminaryAssessmentId: typeof body?.preliminaryAssessmentId === "string" ? body.preliminaryAssessmentId : "",
    track1Complete: body?.track1Complete === true,
    preliminaryAssessmentCreated: body?.preliminaryAssessmentCreated === true,
    reportBinding: body?.reportBinding ?? null,
    baseUrl: typeof body?.baseUrl === "string" ? body.baseUrl : "",
  });

  return jsonResponse(result.ok ? 200 : 409, {
    endpoint: "/api/create-target-session",
    ...result,
  });
}
