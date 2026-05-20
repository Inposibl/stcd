import { validateTargetObservationSetup } from "../src/flow/targetObservationFlow.js";
import { methodNotAllowed, parseJsonBody, jsonResponse } from "./_response.js";
import { isSessionLedgerStorageError, saveTargetObservationSetup } from "./_sessionLedger.js";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return methodNotAllowed(request.method, ["POST"]);
  }

  const body = await parseJsonBody(request);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
  const setup = typeof body?.setup === "object" && body.setup ? body.setup : {};

  if (!sessionId) {
    return jsonResponse(400, {
      status: "invalid-request",
      error: "sessionId is required",
    });
  }

  const validation = validateTargetObservationSetup(setup);
  if (!validation.valid) {
    return jsonResponse(400, {
      status: "setup-incomplete",
      missing: validation.missing,
    });
  }

  let session;
  try {
    session = await saveTargetObservationSetup(sessionId, validation.normalized);
  } catch (error) {
    return jsonResponse(isSessionLedgerStorageError(error) ? 503 : 500, {
      status: isSessionLedgerStorageError(error) ? error.status : "target-observation-setup-save-failed",
      error: error instanceof Error ? error.message : "Target Observation setup could not be saved",
    });
  }

  return jsonResponse(200, {
    status: "target-observation-setup-stored",
    sessionId,
    targetObservationSetup: session.targetObservationSetup,
  });
}
