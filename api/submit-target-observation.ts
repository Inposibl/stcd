import { saveTargetObservationCompletion } from "./_sessionLedger";
import { methodNotAllowed, parseJsonBody, jsonResponse } from "./_response";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return methodNotAllowed(request.method, ["POST"]);
  }

  const body = await parseJsonBody(request);
  const assessmentSessionId = typeof body?.assessmentSessionId === "string" ? body.assessmentSessionId.trim() : "";
  const observationSessionId = typeof body?.observationSessionId === "string" ? body.observationSessionId.trim() : "";
  const codeHash = typeof body?.codeHash === "string" ? body.codeHash.trim() : "";
  const digitalCode = typeof body?.digitalCode === "string" ? body.digitalCode.trim() : "";
  const setup = typeof body?.setup === "object" && body.setup ? body.setup : {};
  const answers = typeof body?.answers === "object" && body.answers ? body.answers : {};
  const targetDiagnostic = typeof body?.targetDiagnostic === "object" && body.targetDiagnostic ? body.targetDiagnostic : {};

  if (!assessmentSessionId || !observationSessionId || !codeHash || !digitalCode) {
    return jsonResponse(400, {
      endpoint: "/api/submit-target-observation",
      status: "invalid-request",
      error: "assessmentSessionId, observationSessionId, codeHash, and digitalCode are required",
    });
  }

  const result = saveTargetObservationCompletion({
    assessmentSessionId,
    observationSessionId,
    codeHash,
    digitalCode,
    setup,
    answers,
    targetDiagnostic,
  });

  return jsonResponse(result.ok ? 200 : 400, {
    endpoint: "/api/submit-target-observation",
    ...result,
  });
}
