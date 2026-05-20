import { isSessionLedgerStorageError, saveTargetObservationCompletion } from "./_sessionLedger.js";
import { methodNotAllowed, parseJsonBody, jsonResponse } from "./_response.js";

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

  let result;
  try {
    result = await saveTargetObservationCompletion({
      assessmentSessionId,
      observationSessionId,
      codeHash,
      digitalCode,
      setup,
      answers,
      targetDiagnostic,
    });
  } catch (error) {
    return jsonResponse(isSessionLedgerStorageError(error) ? 503 : 500, {
      endpoint: "/api/submit-target-observation",
      status: isSessionLedgerStorageError(error) ? error.status : "target-observation-save-failed",
      error: error instanceof Error ? error.message : "Target Observation submission could not be saved",
    });
  }

  return jsonResponse(result.ok ? 200 : 400, {
    endpoint: "/api/submit-target-observation",
    ...result,
  });
}
